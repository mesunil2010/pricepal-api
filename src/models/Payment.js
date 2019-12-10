import legacy_db from '../db/legacy_db'
import rand from 'randexp'
import moment from 'moment';
import { findStrippedById as findMerchantById } from '../models/Merchant'
import getSymbolFromCurrency from 'currency-symbol-map'
import withFilter from '../traits/Filter'

class Payment {
    constructor(data) {
        this.merchantid = 10011;

        if (!data) {
            return
        }

        this.id = data.id
        this.user_id = data.user_id
        this.serialnum = data.serialnum //same as id
        this.trackingid = data.trackingid
        this.transactionamount = data.transactionamount
        this.moneybackamount = data.moneybackamount
        this.commissionamount = data.commissionamount
        //this.revshareamount    = data.revshareamount;
        //this.wlrevshareamount    = data.wlrevshareamount;
        //this.cashbackshareamount    = data.cashbackshareamount;
        this.bonuscashbackamount = data.bonuscashbackamount
        this.validated = data.validated
        this.tracking = data.tracking
        this.received = data.received
        this.declined = data.declined
        this.paid = data.paid
        this.status = data.status
        /* status types:
            Approved
            Cancelled
            Complete
            To account
            Tracking
        */
        this.additionalinfo = data.additionalinfo
        this.createtimestamp = data.createtimestamp
        this.modifytimestamp = data.modifytimestamp
        this.approvedtimestamp = data.approvedtimestamp
        this.paidtimestamp = data.paidtimestamp
        this.version = data.version
        this.currency = data.currency
        this.has_items = data.has_items

        this.aggregator_merchant_id = data.aggregator_merchant_id
        this.aggregator_merchant_name = data.aggregator_merchant_name
        this.aggregator_transaction_id = data.aggregator_transaction_id
        this.aggregator_inserted_at = data.aggregator_inserted_at
        //stored and Forex calculated at point of creation to enable aggregation of balance totals in one currency
        this.user_currency = data.user_currency;
        this.user_currency_transactionamount = data.user_currency_transactionamount;
        this.user_currency_cause_share_amount = data.user_currency_cause_share_amount;
        this.batch_id = data.batch_id;
    }
    static get PENDING() {
        return 'Pending';
      }
      static get COMPLETE() {
        return 'Complete';
      }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var transactions = [];

        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            this.filterArg['merchantid']=10011
            transactions =  await legacy_db('transactions')
                .select('id','batch_id','createtimestamp as created_at','modifytimestamp as paid_at', 'user_id', 'currency', 'transactionamount', 'status', 'merchantid as merchant_id')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
           
            //format for ouput, abstract this into controller once validated against need
            for(var i=0;i<transactions.length;i++)
            {
                var currency_code = "AUD";
                if(transactions[i].user_currency)currency_code = transactions[i].user_currency;
                //this should be applied on the frontend, remove this when applied in signup.folo.world
                var currency_char = getSymbolFromCurrency(currency_code);
                if(transactions[i].transactionamount)transactions[i].transactionamount = transactions[i].transactionamount.toFixed(2);
                //if(transactions[i].moneybackamount)transactions[i].moneybackamount = currency_char+transactions[i].moneybackamount.toFixed(2);
                //if(transactions[i].bonuscashbackamount) transactions[i].bonuscashbackamount = currency_char+transactions[i].bonuscashbackamount.toFixed(2);
                if(transactions[i].created_at)transactions[i].created_at = moment(transactions[i].created_at).format("YYYY-MM-DD HH:mm:ss");
                if(transactions[i].paid_at)transactions[i].paid_at = moment(transactions[i].paid_at).format("YYYY-MM-DD HH:mm:ss");
                if(transactions[i].merchant_id)transactions[i].merchant=await findMerchantById(transactions[i].merchant_id)
            }
            return transactions;
           
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

  
   

    @withFilter
    async count(request) {
        var transactions;
        try {
            this.filterArg['merchantid']=10011;
            [transactions] =  await legacy_db('transactions')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return transactions.totalCount;
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async find(id) {
        try {
            let result = await findById(id)
            if (!result) return {}
            this.constructor(result)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('transactions').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            let response= await legacy_db('transactions')
                .update(this)
                .where({ id: this.id })
            return response
            
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findByTrackingId(trackingid, merchantid) {
        try {
            let [transaction] = await legacy_db('transactions')
                .select('*')
                .where({ trackingid: trackingid, merchantid: merchantid })

            if (!transaction) return {}
            this.constructor(transaction)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
    async findByAggregatorId(id) {
        try {
            let [transaction] = await legacy_db('transactions')
                .select('*')
                .where({ aggregator_transaction_id: id })

            if (!transaction) return {}
            this.constructor(transaction)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
}
async function findById(id) {
    try {
        let [noteData] = await legacy_db('transactions')
            .select('*')
            .where({ id: id })
        return noteData
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function getTotalBonusInBank(user_id) {
    try {
        let [data] = await legacy_db('cashback_bonus_bank')
            .sum('amount as total_bonus')
            .where({ user_id: user_id, status: 'ACTIVE' })
        return data.total_bonus
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Payment, findById, getTotalBonusInBank }

/*
CREATE TABLE `transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Global transaction ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User ID',
  `serialnum` bigint(20) unsigned NOT NULL DEFAULT '0',
  `trackingid` varchar(100) NOT NULL DEFAULT '0',
  `merchantid` bigint(20) unsigned NOT NULL DEFAULT '0',
  `transactionamount` double DEFAULT '0',
  `moneybackamount` double DEFAULT '0',
  `commissionamount` double DEFAULT '0',
  `revshareamount` double DEFAULT '0',
  `wlrevshareamount` double DEFAULT '0',
  `cashbackshareamount` double DEFAULT '0',
  `bonuscashbackamount` double DEFAULT NULL,
  `validated` char(1) DEFAULT 'N',
  `tracking` char(1) DEFAULT 'N',
  `received` char(1) DEFAULT 'N',
  `declined` char(1) DEFAULT 'N',
  `paid` char(1) DEFAULT NULL,
  `status` varchar(10) DEFAULT 'Tracking',
  `additionalinfo` varchar(255) DEFAULT NULL,
  `createtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modifytimestamp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `approvedtimestamp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `paidtimestamp` datetime DEFAULT NULL,
  `version` tinyint(4) NOT NULL DEFAULT '1',
  `currency` char(3) NOT NULL DEFAULT 'AUD',
  `check_hash` text,
  `rev_share_id` int(11) DEFAULT NULL,
  `wl_rev_share_user_id` bigint(20) DEFAULT NULL,
  `cashback_share_id` int(11) DEFAULT NULL,
  `bonus_id` int(11) DEFAULT NULL,
  `uplift_id` int(11) DEFAULT NULL,
  `rapidpay_transaction_id` int(11) DEFAULT NULL,
  `has_items` tinyint(1) NOT NULL DEFAULT '0',
  `cause_share` tinyint(4) DEFAULT NULL,
  `cause_share_amount` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `serialnum` (`serialnum`),
  KEY `modifytimestamp` (`modifytimestamp`),
  KEY `merchantid` (`merchantid`,`modifytimestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=580705 DEFAULT CHARSET=latin1;*/
