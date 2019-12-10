//import db from '../db/db'
import legacy_db from '../db/legacy_db'
import { TransactionTotals } from './TransactionTotals';
import getSymbolFromCurrency from 'currency-symbol-map'
import dateFormat from 'date-fns/format'

import withHistory from '../traits/History'
import withFilter from '../traits/Filter'

import CacheService from '../cache/CacheService.js'

const ttl = 60 * 60 * 24 // cache for 24 Hour
const cache = new CacheService(ttl) // Create a new cache service 

@withHistory
class User {
    
    constructor(data) {
        if (!data) {
            return
        }
        this.id = data.id
        this.challengesalt = data.challengesalt
        this.password = data.password
        this.email = data.email
        this.username = data.username
        this.is_admin = data.is_admin
        this.cause_categories = data.cause_categories
        this.firstname = data.firstname
        this.lastname = data.lastname
        this.default_currency = data.default_currency;
        this.oauth_provider = data.oauth_provider
        this.oauth_uid = data.oauth_uid;

        this.status = data.status;
        this.level = data.level;
        this.referrer = data.referrer;
        this.refid = data.refid;
        this.ref_code = data.ref_code;
        this.source = data.source;

        this.joindate = data.joindate
        this.lastlogindate = data.lastlogindate;
        this.activation_date = data.activation_date

        this.testuser = data.testuser;
        this.notifications = data.notifications;

        this.lastloginipaddress = data.lastloginipaddress

        this.twitter_id = data.twitter_id;

        this.api_secret = data.api_secret;
        this.api_secret_generation_date = data.api_secret_generation_date;

        this.password_reset_token = data.password_reset_token;
        this.password_reset_expiration = data.password_reset_expiration;

        this.threatmetrix_profiled  = data.threatmetrix_profiled;
        this.last_transaction_date = data.last_transaction_date;
        this.browser_info = data.browser_info;
        this.region = data.region;

        this.cause_id = data.cause_id;
        this.cause_name = data.cause_name;
        this.influencer_id = data.influencer_id;
        this.influencer_username = data.influencer_username;
        this.signup_on_mobile = data.signup_on_mobile;

        this.auto_fund = data.auto_fund;

        this.email_channel_version = data.email_channel_version;// 1 = customer.io, 2 = campaignmonitor

    }
    
    @withFilter
    async all(request) {
        try {
            var limit = 100
            var order = 'DESC'
            var orderBy = 'id'
            var page = 0
            var users
        
            if (request) {
                if (request.order) order = request.order
                if (request.order) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }

            users = await legacy_db('users')
                .select('id', 'username', 'email', 'firstname', 'lastname', 'status', 'level', 'joindate', 'lastlogindate')
                .where(this.filter(this.filterArg))
                .offset(+page * +limit)
                .limit(+limit)
            
            for(var i=0;i<users.length;i++)
            {
                users[i].joindate = dateFormat(users[i].joindate , "YYYY-MM-DD HH:mm:ss");
                users[i].lastlogindate = dateFormat(users[i].lastlogindate , "YYYY-MM-DD HH:mm:ss");
            }

            return users

        } catch (error) {
            console.log('User: all:' + error)
            throw new Error('ERROR')
        }
    }

    async find(id) {

        let cache_key = 'user-' + id
        let cached_str = await cache.get(cache_key)
        if (cached_str) {
            let result = JSON.parse(cached_str)
            this.constructor(result)
            return this;
        }

        try {
            let result = await findById(id)
            if (!result) return {}
            this.constructor(result)
            await cache.set(cache_key, JSON.stringify(result))
        } catch (error) {
            console.log('User: find:' + error)
            throw new Error('ERROR')
        }
    }

    async findModel(id) {

        let cache_key = 'userModel-' + id
        let cached_str = await cache.get(cache_key)
        if (cached_str) {
            let result = JSON.parse(cached_str)
            this.constructor(result)
            return result;
        }

        try {
            let result = await findModelById(id)
            if (!result) return {}
            this.constructor(result)
            await cache.set(cache_key, JSON.stringify(result))
            return result;
        } catch (error) {
            console.log('User: find:' + error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('users')
                .insert(this)
                .returning('id')
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            let response= await legacy_db('users')
                .update(this)
                .where({ id: this.id })
            return response
            
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        try {
            var users     
            [users] = await legacy_db('users')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))

            return users.totalCount
            
        } catch (error) {
            console.log('User: count error:' + error)
            throw new Error('ERROR')
        }
    }

}

async function findById(id) {
    try {
        let [userData] = await legacy_db('users')
            .select('*')     
            .where({ id: id })
         
        if(typeof userData =='undefined')  {
            [userData] = await legacy_db('wl_folo_users')
            .select('*')
            .where({ id: id })
        }  
        return userData
        
    } catch (error) {
        throw new Error('ERROR')
    }
}

async function findModelById(id) {
    try {
        let [userData] = await legacy_db('users')
           .select('id', 'username', 'email', 'firstname', 'lastname', 'status', 'is_admin', 'level', 'api_secret', 'joindate', 'lastlogindate')     
            .where({ id: id })
         
        if(typeof userData =='undefined')  {
            [userData] = await legacy_db('wl_folo_users')
            .select('id', 'username', 'email', 'firstname', 'lastname', 'status', 'is_admin', 'level', 'api_secret', 'joindate', 'lastlogindate')
            .where({ id: id })
        }  

        userData.joindate = dateFormat(userData.joindate , "YYYY-MM-DD HH:mm:ss");
        userData.lastlogindate = dateFormat(userData.lastlogindate , "YYYY-MM-DD HH:mm:ss");
        return userData
        
    } catch (error) {
        throw new Error('ERROR')
    }
}

async function findByAPIKey(key) {
    try {
        const [userData] = await legacy_db('users')
            .select('*')
            .where({ api_secret: key })
        return userData
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function findByEmail(email) {
    try {

        const [userData] = await legacy_db('users')
            .select('*')
            .where({ email: email })

        return userData
    } catch (error) {
        console.log('Error: User: findByEmail:', email, error)
        throw new Error('ERROR')
    }
}

async function findByUsername(username) {
    try {

        const [userData] = await legacy_db('users')
            .select('*')
            .where({ username: username })

        return userData
    } catch (error) {
        console.log('Error: User: username:', username, error)
        throw new Error('ERROR')
    }
}

    async function getUserTransactionTotals(user_id)
    {
        const user = new User()
        await user.find(user_id);
        if(!user.id)throw new Error("User with id "+user_id+" not found.");

        var total_income = 0;
        var total_outgoing = 0;

        var r_obj = {total: 0, approved: 0, pending:0};

        //get user's pending and approved balance they have left
        const transactionT = new TransactionTotals();
        let total_transactions = await transactionT.show({user_id:user_id});

        r_obj.total     =   total_income = total_transactions.total.amount;
        r_obj.approved  =    total_transactions.approved.cause_share_amount;
        r_obj.pending   =    total_transactions.pending.cause_share_amount;
        r_obj.currency  =    user.default_currency;

        var currency_symbol = getSymbolFromCurrency(r_obj.currency)
        r_obj.formatted = {
            pending : currency_symbol+r_obj.pending,
            approved :currency_symbol+r_obj.approved,
            total:currency_symbol+ r_obj.total
        }

        return r_obj;
    }
    /**
     *  Example of response:  { total: , approved: , pending: ,currency: }
     *
     * @param {*} user_id
     */
    async function getUserBalance(user_id)
    {
        const user = new User()
        await user.find(user_id);
        if(!user.id)throw new Error("User with id "+user_id+" not found.");

        var total_income = 0;
        var total_outgoing = 0;

        var r_obj = {total: 0, approved: 0, pending:0};

        //get user's pending and approved balance they have left
        const transactionT = new TransactionTotals();
        let total_transactions = await transactionT.show({user_id:user_id});
        //only use the bits we need
        r_obj.total = total_income = total_transactions.total.amount;
        r_obj.approved =  total_transactions.approved.cause_share_amount;
        r_obj.pending  =  total_transactions.pending.cause_share_amount;


        //format output with currency prefix as separate value, this enables clients to perform calculations without format concerns


        r_obj.pending = Number(r_obj.pending).toFixed(2)
        r_obj.approved = Number(r_obj.approved).toFixed(2)
        r_obj.total = Number(r_obj.total).toFixed(2)

        r_obj.currency = user.default_currency;

        if(!r_obj.currency)
        {
            r_obj.currency = total_transactions.total.currency;
        }
        if(!r_obj.currency)
        {
            r_obj.currency = "AUD";
        }

        var currency_symbol = getSymbolFromCurrency(r_obj.currency)
        r_obj.formatted = {
            pending : currency_symbol+r_obj.pending,
            approved :currency_symbol+r_obj.approved,
            total:currency_symbol+ r_obj.total
        }
        return r_obj

    }
export { User, findById, findByEmail,findByUsername, findByAPIKey, getUserBalance, getUserTransactionTotals }
