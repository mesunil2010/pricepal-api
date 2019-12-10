import joi from 'joi'
import legacy_db from '../db/legacy_db'
import moment from 'moment'
import dateFormat from 'date-fns/format'

import { Transaction,findByTrackingId } from '../models/Transaction'
import { TransactionTotals } from '../models/TransactionTotals'
import logger from '../logger/log.js'
import { Merchant, findById as findMerchantById } from '../models/Merchant'
import { User, findById as findUserById,findByUsername as findUserByUsername} from '../models/User'
import { BuddyBonus} from '../models/BuddyBonus'
import getSymbolFromCurrency from 'currency-symbol-map'
import { getMoneyBackAmount, getBonusCashBackAmount } from '../common/Util';


const aggregatorTransactionSchema = joi.object({
    id: joi.number().integer(),
    sub_id: joi.string().allow(''),
    company_id: joi.number().integer(),
    merchant_id: joi
        .number()
        .integer()
        .required(),
    merchant_name: joi.string().required(),
    network_id: joi
        .number()
        .integer()
        .required(),
    network_account_id: joi
        .number()
        .integer()
        .required(),
    network_transaction_id: joi.string().required(),
    status: joi.string().required(), //
    value: joi.number().required(),
    commission: joi.number().required(),
    currency: joi.string().required(),
    created_at: joi.date(),
    updated_at: joi.date().allow(null).optional(),
    notes: joi.string().allow(null).optional(), //optional
})


class TransactionController {
    async index(ctx) {
        const params = ctx.params
        const query = ctx.query

        const autenticatedUser = new User(ctx.state.user)
        if(autenticatedUser.is_admin!=1){
            if(query.filter)
                query.filter=  query.filter+'|user_id:'+autenticatedUser.id;
            else
                query.filter= 'user_id:'+autenticatedUser.id;
        } else {

        }

        try {
            var transaction = new Transaction()

            var items = await transaction.all(query);
            ctx.body = items;
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await transaction.count(query));


            // if (ctx.params.transaction_id) {
            //     await c_obj.find(ctx.params.transaction_id)
            //     result = c_obj
            //     ctx.body = result

            // } else {

            //     query.user_id = autenticatedUser.id;
            //     //console.log("info","TC",query.user_id )
            //     result.transactions = await c_obj.all(query)

            //     for(var t=0;t<result.transactions.length;t++)
            //     {
            //         let transaction = result.transactions[t];
            //         // use data from transaction, wrap in own object, then delete it from transaction
            //         var merchant_holder = {
            //             id:transaction.merchant_id,
            //             name: transaction.merchant_name
            //         }

            //         if(result.transactions[t].merchant_id)
            //         {
            //             // add merchant
            //             let m = new Merchant();
            //             await m.find(result.transactions[t].merchant_id)
            //             merchant_holder = m;
            //         }
            //         //delete transaction.merchant_id;
            //         //delete transaction.merchant_name;

            //         result.transactions[t].merchant = merchant_holder;
            //     }
            //     ctx.body = result.transactions;
            // }

        } catch (error) {
            logger.log('error','TransactionController:',error)
            ctx.throw(400, 'INVALID_DATA' + error)
        }
    }
    async total(ctx) {
        const query = ctx.query

        const autenticatedUser = new User(ctx.state.user)
        if(autenticatedUser.is_admin!=1){
            if(query.filter)
                query.filter=  query.filter+'|user_id:'+autenticatedUser.id;
            else
                query.filter= 'user_id:'+autenticatedUser.id;
        } 

        const c_obj = new TransactionTotals()
        try {
            await c_obj.show(query)
            ctx.body = c_obj.total_transactions;
        } catch (err) {
            logger.log('error',err)
        }
    }

    async create(ctx)
    {
        const body = ctx.request.body;
        const authenticatedUser = new User(ctx.state.user)

        if(!authenticatedUser.is_admin)
        {
            ctx.throw(400, 'ADMIN_ONLY')
        }

        const schema = joi.object({
            user_id: joi.number().integer().required(),
            value: joi.number().required()
        })

        const validator = joi.validate(
            body,
            schema,
            { allowUnknown: true }
        )

        if (validator.error) {
            console.log(validator.error.details[0].message)
            ctx.throw(validator.error.details[0].message)
        }

        const user = new User()
        await user.find(body.user_id)
        if(!user.id)
        {
            ctx.throw(404, 'INVALID_USER')
        }
        ctx.body = await this.createBonusTransaction(user, body.value)
    }


    async parseTransactions(ctx){
        try {
            const request = ctx.request.body
            //Check if request has transactions 
            let transactions = request.transactions
            if (!transactions) {
                ctx.throw(
                    400,
                    'INVALID_DATA (no transactions) ' + request,
                    transactions
                )
            }
            //Check if transactions is string then parse it
            if(typeof transactions =='string')
            {
                return transactions = JSON.parse(transactions);
            }else{
                return transactions
            }
        } catch(err){
            console.log('Error : can not parse transactions',err)
        }
    }


    async getUserBySubId(sub_id){
        try {
            var user_id = sub_id;
            /*if(sub_id.indexOf("User_")>-1)
            {
                user_id = sub_id.split("_")[1];
            }else{

            }*/
            let user =  await findUserByUsername(sub_id);//await findUserById(user_id);

            
            return user
        } catch (error) {
            console.log('TransactionController: upsert:', error)
        }
    }

    /**
     * To be called only from the aggregator initiated webook. Expect transactions in Aggregator format, convert into the Legacy format.
     *
     * Expect 1-100 transactions at a time
     *
     * Use the legaccy format for now while there exists the posibility of needing to align the codebases, or reuse elements.
     *
     * ToDo: refactor
     *
     * @param {*} ctx
     */
    async upsertFromAggregator(ctx) {

        //Step1 : Get and parse transactoions
        let transactions = await this.parseTransactions(ctx)
       
        let inserted_transactions_count = 0;
        let updated_transactions_count = 0
        let ignored_transactions_count = 0 
        let errored_transactions_count = 0 

        for (var i = 0, len = transactions.length; i < len; i++) {
            
            var transaction = transactions[i]

            //Next do validation on the input
            const validator = joi.validate(
                transaction,
                aggregatorTransactionSchema,
                { allowUnknown: true }
            )

            if (validator.error) {
                console.log(
                    'error TransactionController aggregatorTransactionSchema',
                    validator.error.details[0].message, transaction.updated_at
                )
                errored_transactions_count++;
                continue
            }

            //Step3: Map merchant to transaction
            var legacyTransaction = new Transaction()
            var oldStatus=''
            try {
                let exisiting_transaction = new Transaction()
                if(transaction.id){
                    await exisiting_transaction.findByAggregatorId(transaction.id)
                    if (exisiting_transaction.id){
                        legacyTransaction = exisiting_transaction
                        oldStatus=exisiting_transaction.status
                    }
                }
            } catch (err) {
                console.log('error: Transaction upsert', err)
                errored_transactions_count++;
            }
            //legacy defaults
            legacyTransaction.version = 2
            legacyTransaction.additionalinfo = ''
            legacyTransaction.bonuscashbackamount = 0
            //new, won't sync to old table
            legacyTransaction.aggregator_merchant_id    = transaction.merchant_id
            legacyTransaction.aggregator_merchant_name  = transaction.merchant_name
            legacyTransaction.aggregator_network_id     = transaction.network_id
            legacyTransaction.aggregator_transaction_id = transaction.id
            legacyTransaction.aggregator_inserted_at    = transaction.inserted_at

            if(transaction.merchant)
            {
                legacyTransaction.merchantid = transaction.merchant.starthere_merchant_id;
            }
            //this.syncMerchantFromAggregator(aggregator_merchant_id);

           //Step2: Parse user from Sub ID and Map it
            var user = {}
            if (!transaction.sub_id) {
                ignored_transactions_count++
                continue
            } else {
                var user= await this.getUserBySubId(transaction.sub_id)
                //if not found in Pricepal user table ignore this transaction
                if (!user) {
                    ignored_transactions_count++
                    continue
                }
                legacyTransaction.user_id = user.id
            }
            //Step4: Map tracking id
            legacyTransaction.trackingid = transaction.network_transaction_id

            legacyTransaction.user_currency_transactionamount = legacyTransaction.transactionamount = transaction.value
            legacyTransaction.user_currency = legacyTransaction.currency = transaction.currency


            //ToDo: once aggregator has detailed transaction functionality hard code
            legacyTransaction.has_items = 0

            var status_mapping = {
                approved: 'Approved',
                rejected: 'Cancelled',
                pending: 'Tracking',
                paid: 'Complete',
                paid_to_user: 'To account',
                mixed: 'Tracking',
            }
            //paid/Complete and paid_to_user/To account, are not used currently by aggregator, they are internal to legacy platform but here for reference

            legacyTransaction.status = status_mapping[transaction.status];

            if (!status_mapping[transaction.status] || !legacyTransaction.status ) {
                logger.log('error','unrecognised transaction status from aggregator',transaction.status)
                continue
            }
            if(transaction.updated_at&&transaction.updated_at!=""&&transaction.updated_at!="0000-00-00 00:00:00"){
                //legacyTransaction.modifytimestamp = transaction.updated_at
            }else{
                legacyTransaction.modifytimestamp = transaction.created_at
            }


            if (transaction.status == 'approved')
                if(transaction.updated_at&&transaction.updated_at!=""&&transaction.updated_at!="0000-00-00 00:00:00"){
                    legacyTransaction.approvedtimestamp = transaction.updated_at
                }else{
                    legacyTransaction.approvedtimestamp = transaction.created_at;
                }

            legacyTransaction.commissionamount = transaction.commission

            legacyTransaction.user_currency_cause_share_amount = legacyTransaction.cause_share_amount = Number(transaction.commission * 0.7).toFixed(2); //FOLO commission revshare
            
            if(!legacyTransaction.merchantid){
                errored_transactions_count++;
                continue
            }
            
            try{
               var merchant = await findMerchantById(legacyTransaction.merchantid)
                legacyTransaction.moneybackamount = await getMoneyBackAmount(legacyTransaction, merchant, user)
                legacyTransaction.bonuscashbackamount = await getBonusCashBackAmount(legacyTransaction, merchant, user)
            } catch(err){
                console.log(err)
                errored_transactions_count++;
            }
          

            if(!user.default_currency)user.default_currency = "AUD";

            legacyTransaction.user_currency = user.default_currency;

            try{
                //store a Forex Conversion at this point
                if(legacyTransaction.currency!= user.default_currency)
                {
                    //perform conversion
                    var cc = require('currency-converter')({ CLIENTKEY: process.env.OPEN_EXCHANGE_RATES_API_KEY});

                    let converted_total  = await cc.convert(legacyTransaction.transactionamount,
                        legacyTransaction.currency,
                        legacyTransaction.user_currency )

                    let converted_cause  = await cc.convert(legacyTransaction.cause_share_amount,
                        legacyTransaction.currency,
                        legacyTransaction.user_currency)

                    legacyTransaction.user_currency_transactionamount=converted_total.amount;
                    legacyTransaction.user_currency_cause_share_amount=converted_cause.amount;

                    //logger.log("info","converted currency for transaction:",legacyTransaction.currency, legacyTransaction.cause_share_amount,user.default_currency, legacyTransaction.user_currency_cause_share_amount )
                }
            }catch(err){
                console.log(err)
                errored_transactions_count++;
            }
            
          
            try{
                //insert or update if exisiting transaction
                if (legacyTransaction.id) {
                    //logger.log("update",legacyTransaction.id)
                    await legacyTransaction.update()
                    updated_transactions_count++
                    
                } else {

                    let [id] = await legacyTransaction.insert()
                    legacyTransaction.id = legacyTransaction.serialnum = id
                    await legacyTransaction.update()
                    inserted_transactions_count++

                    // try{
                    //     await this.sendNewTransactionEmailToUser(user, legacyTransaction);
                    // }catch(err)
                    // {
                    //     logger.error('Error sending new transaction email')
                    //     errored_transactions_count++;
                    // }
                    // try{
                    //     // refactor this into SQS
                    //     await this.postTransactionToSlack(user, legacyTransaction);

                    // }catch(err)
                    // {
                    //     logger.error('Error sending new transaction slack post', err)
                    // }
                }
                //Deduct the applied bonus from bonus bank
                await this.processBuddyBonus(legacyTransaction)

                //Ready to pay logic
                if(legacyTransaction.aggregator_transaction_id)
                    await this.processReadyToPay(legacyTransaction)
                
            }catch(err)
            {
                logger.error('Error during inserting or updating transaction', err)
                errored_transactions_count++;
            }

        }

        let return_obj = {
            recieved: transactions.length,
            updated: updated_transactions_count,
            ignored: ignored_transactions_count,
            inserted: inserted_transactions_count,
            errored: errored_transactions_count
        }
        logger.log('info', 'webhook results:', return_obj)
        ctx.body = return_obj
        return
    }

    async postTransactionToSlack(user, legacyTransaction){

        const Slack = require('slack-node')
        const slack = new Slack()
        slack.setWebhook(process.env.SLACK_WEBHOOK)
        var default_opts = {
            channel: '#pricepal_transactions',
            username: 'JeevesBot',
        }

        default_opts.text = user.firstname+" "+legacyTransaction.user_id+" "+ legacyTransaction.aggregator_merchant_name+" "+legacyTransaction.commissionamount+" "+legacyTransaction.currency;

        //merge both - warning this is es6 so check production env
        //Object.assign(default_opts, opts);

        slack.webhook(default_opts, function(err, response) {
            if (err) {
                console.log('error', 'slack', response)
            }
        })
    }

    async sendNewTransactionEmailToUser(user, transaction)
    {
        var createsend = require('createsend-node');
        //var auth = { apiKey: '60ef9d16c732e34394314f8f37db657f0e9a623c9758a922' };
        var apiDetails = { apiKey: process.env.CM_API_KEY};
        var api = new createsend(apiDetails);

        // Create a details object
        var details = {};
        details.smartEmailID = '';//'b5e64a96-d908-4403-8e46-87089d6c3007';

        const tConst = new Transaction();
        var user_transactions = await tConst.all({user_id:user.id});

        try{
            //if first transaction use different template
            if(user_transactions.length==1)
            {

            }
        }catch(e)
        {
            details.smartEmailID = '';//"70de91a3-0a1b-4756-a164-4753bc939a03";
        }

        // Add the unique identifier for the smart email
        // Add the 'To' email address
        details.to = user.email;//"Aden Forshaw <aden@folo.world>";
        let currency_symbol = getSymbolFromCurrency(transaction.currency);

        // Add mail merge variables
        details.data = {
            "commission_amount": currency_symbol+Number(transaction.cause_share_amount).toFixed(2),
            "transaction_amount": currency_symbol+Number(transaction.transactionamount).toFixed(2),
            "merchant_name":transaction.aggregator_merchant_name,
            "firstname": user.firstname,
        }


        //if balance is present on the user object then add, otherwise don't so the email template can use the fallback
        ///if(user.total_balance)details.data.total_balance = currency_symbol+Number(user.total_balance).toFixed(2);
        //else{



                //ToDo: abstract away
        var r_obj = {total: 0, approved: 0, pending:0};
        //get user's pending and approved balance they have left
        const transactionT = new TransactionTotals();
        let total_transactions = await transactionT.show({user_id:user.id});
        //only use the bits we need
        let num_transaction = total_transactions.total.count;
        r_obj.total =  total_transactions.total.amount;
        r_obj.approved =  total_transactions.approved.cause_share_amount;
        r_obj.pending  =  total_transactions.pending.cause_share_amount;


        const impactT = new ImpactTotals();
        let totalImpacts = await impactT.get({user_id:user.id});
        //r_obj.impacts = totalImpacts
        //subtract the total of each Imapct the user has made
        r_obj.total -= totalImpacts.total.amount;
        r_obj.approved -= totalImpacts.total.amount;

        //go through the approved balance first
        if(r_obj.approved < 0 )
        {
            //if there's any remainder, go through the pending
            r_obj.pending -= r_obj.approved;
            r_obj.approved =0;
        }
        r_obj.pending = Number(r_obj.pending).toFixed(2)
        r_obj.approved = Number(r_obj.approved).toFixed(2)
        r_obj.total = Number(r_obj.total).toFixed(2)

        //var currency =
        var total_currency_symbol = getSymbolFromCurrency(total_transactions.total.currency)
        r_obj.formatted_pending = total_currency_symbol+r_obj.pending
        r_obj.formatted_approved = total_currency_symbol+r_obj.approved
        r_obj.formatted_total = total_currency_symbol+ r_obj.total

        details.data.total_balance   = r_obj.formatted_total;
       // }
        // Send the smart email(and provide a callback function that takes an error and a response parameter)
        api.transactional.sendSmartEmail(details, function (err, res) {
            if (err) {
                /*do something*/
                console.log("error","error sending transaction email through CM",err)
            } else {
                /*do something*/
                console.log("info","success sending transaction email through CM")
            }
        });

        //update LastTransactionDate
        //Campaignmonitor Date format: yyyy/mm/dd
        var LastTransactionDate = moment().format("YYYY/MM/DD");
        var listId = process.env.CM_SIGNUP_LIST_ID;
        var details = {
            CustomFields: [

                { Key: 'NumberTransactions', Value: num_transaction},
                { Key: 'LastTransactionDate', Value:LastTransactionDate}
            ]
        };
        console.log("info","transactionController","updateSub",details)
        //Add the new user as a subscriber to the list
        api.subscribers.updateSubscriber(listId, user.email, details, (err, res) => {
            if (err) console.log(err);
            //if (res) console.log(res);
        });


    }

    async processReadyToPay(legacyTransaction){
        try {
            if (legacyTransaction.id && legacyTransaction.status == 'To account') {
                var readyTransaction = await findByTrackingId(legacyTransaction.id)
                if(typeof readyTransaction.id =='undefined'){
                    var transactionData={
                        'trackingid' : legacyTransaction.id,
                        'merchantid' : 10000,
                        'transactionamount' : '-'+legacyTransaction.transactionamount,
                        'user_id' : legacyTransaction.user_id
                    }
                    var specialTransaction = new Transaction(transactionData)
                    await specialTransaction.insert()
                }
                
            }
        } catch(err) {
            logger.error('Error in buddy bonus action', err)
        }
    }

    async processBuddyBonus(legacyTransaction){
        try {
            if(legacyTransaction.id && legacyTransaction.bonuscashbackamount>0){
                let buddyBonus = new BuddyBonus();
                if(legacyTransaction.status == 'Cancelled'){
                    buddyBonus.amount = Number(legacyTransaction.bonuscashbackamount)
                    buddyBonus.type = 'REVERSED_TRANSACTION_BONUS'
                }else{
                    await buddyBonus.findExisingByTransaction(legacyTransaction.id)
                    buddyBonus.amount = Number('-'+legacyTransaction.bonuscashbackamount)
                    buddyBonus.type = 'TRANSACTION_BONUS'
                }
                if(buddyBonus.id){
                    await buddyBonus.update();
                }else{
                    buddyBonus.transaction_id = legacyTransaction.id
                    buddyBonus.user_id = legacyTransaction.user_id
                   
                    buddyBonus.status = 'ACTIVE'
                    buddyBonus.date = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
                    await buddyBonus.insert();
                }
            }
        } catch(err) {
            logger.error('Error in buddy bonus action', err)
        }
    }

}

export default  TransactionController
