
import legacy_db from '../db/legacy_db'
import joi from 'joi'
import rand from 'randexp'
import jsonwebtoken from 'jsonwebtoken'
import dateFormat from 'date-fns/format'
import dateAddMinutes from 'date-fns/add_minutes'
import dateAddMonths from 'date-fns/add_months'
import dateCompareAsc from 'date-fns/compare_asc'
import moment from 'moment'
import logger from '../logger/log.js'
import { User,findByEmail } from '../models/User';
import {Transaction} from '../models/Transaction'

const userSchemaSignup = joi.object({
    firstname: joi
        .string()
        .min(1)
        .max(50)
        .required(),
    email: joi
        .string()
        .email()
        .required(),
        signup_on_mobile: joi
        .boolean()
        .default(false)
        .optional(),
    testuser: joi
        .boolean()
        .default(false)
        .optional(),
    cause_id: joi.number(),
    cause_name: joi.string(),
    influencer_username: joi.string(),
    influencer_id: joi.number(),
    password: joi
        .string()
        .min(8)
        .max(100)
        .required(),
})

const userSchemaResetPassword = joi.object({
    email: joi
        .string()
        .email()
        .required(),
    password: joi
        .string()
        .min(8)
        .max(35)
        .required(),
    password_reset_token: joi.string().required(),
})

class UserController {
    constructor() {}

    async signup(ctx) {
        //First let's save off the ctx.request.body. Throughout this project
        //we're going to try and avoid using the ctx.request.body and instead use
        //our own object that is seeded by the ctx.request.body initially
        const request = ctx.request.body

        //Next do validation on the input
        const validator = joi.validate(request, userSchemaSignup)
        if (validator.error) {
            ctx.throw(400, validator.error.details[0].message)
        }

        return await this.genericSignup(request, ctx)
        //this section should be generic with oauthsignup, condese down
    }

    async isEmailFromTestUser(email)
    {
        // email could contain multiple @ so take last
        var email_string_array = email.split("@");
        var domain_string_location = email_string_array.length -1;
        var final_domain = email_string_array[domain_string_location];

        if(final_domain=='folo.world')
        {  
            if(email_string_array[0].indexOf('+')>0)return true
        }
        return false;
    }

    //registration
    async genericSignup(request, ctx) {
        //Check for duplicate email
       
        request.email = request.email.toLowerCase();

            var exisitingUser = await findByEmail(request.email);
            if (exisitingUser) {
                ctx.throw(400, 'DUPLICATE_EMAIL')
                return;
            }
        
        let newUser = new User();

        const crypto = require('crypto')
        newUser.challengesalt = crypto.randomBytes(12).toString('hex')
        //Ok now let's hash their password.
        try {
            var hash = crypto.createHash('sha256')
            hash.update(newUser.challengesalt + request.password)//don't use user entered password from here onwards
            newUser.password = hash.digest('hex')
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_PASSWORD')
        }

        newUser.signup_on_mobile = ctx.userAgent.isMobile 
       
        try {
            //Add the user to the legacy DB
            newUser.username = 'User_new-'+Math.random()
            newUser.email = request.email
            newUser.firstname = request.firstname;
            newUser.source = process.env.APP_URL;

            // check if it's a testuser / one created by front or back-end automated tests
            newUser.testuser = await this.isEmailFromTestUser(newUser.email)
            

            //Ok now generate api_key
            try {
                //const uuidv4 = require('uuid/v4');
                var randomstring = require("randomstring");
                newUser.api_secret = randomstring.generate();//uuidv4(); //switched to 32 character alphanumeric to be backwards compatiable with legacy products
                newUser.api_secret_generation_date = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss');
            } catch (error) {
                ctx.throw(500, 'INVALID_DATA')
            }

            //newUser.challengesalt = request.challengesalt

            newUser.level = 'USER_1'
            newUser.ipaddresses = newUser.lastloginipaddress = ctx.request.ip
            newUser.signup_on_mobile = ctx.userAgent.isMobile 

            newUser.joindate = newUser.lastlogindate = newUser.cause_share_update_date = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            newUser.cause_share = 100
            newUser.browser_info = ctx.userAgent.source

            try{

                let [newUserId] = await newUser.insert();
                newUser.username = 'User_' + newUserId
                newUser.id = newUserId;
            }catch(error)
            {
                console.log("Error inserting new user")
                console.log(error)
                ctx.throw(503, 'Temporary service error, try again later.')
            }

            try{
                await newUser.update();
            }catch(error)
            {
                console.log("Error inserting updating user")
                console.log(error)
                ctx.throw(503, 'Temporary service error, try again later.')
            }
            
        } catch (error) {
            logger.log(error)
            ctx.throw(503, 'Temporary service error, try again later.')
        }
        //if the user signed up from a Cause, include that in their share url
        if (newUser.cause_id) {
            try{
                const causeConst = new Cause();
                await causeConst.find(newUser.cause_id)
                if(causeConst.id)newUser.cause_name = causeConst.url_name
            }catch(e)
            {
                logger.log(e)
            }
        }

        // clean object to return on signup
        var r_user = {
            is_admin: newUser.is_admin,
            id: newUser.id,
            username: newUser.username,
           // url_name: userData.url_name,
            email: newUser.email,
            cause_categories:   newUser.cause_categories,
            firstname: newUser.firstname,
            cause_id : newUser.cause_id,
            cause_name : newUser.cause_name,
            influencer_id : newUser.influencer_id,
            influencer_username : newUser.influencer_username,
            api_secret: newUser.api_secret
        }

        try {
            var rToken = await this.generateJWTToken(ctx, r_user)
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
        
        if(process.env.NODE_ENV!="testing" && !newUser.testuser)
        {
            try{
                await this.addUserToSubscriberList(newUser);
                await this.createSignupTransaction(r_user);
                await this.postNewUserToSlack(r_user);
            }catch(err)
            {
                logger.log(err)
            }
        }

        try{
            //And return our response.
            ctx.body = {
                message: 'SUCCESS',
                user: r_user,
                jwt_token: rToken,
            }

        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
    async addUserToSubscriberList(newUser)
    {
        var createsend = require('createsend-node');
        var apiDetails = { apiKey: process.env.CM_API_KEY};
        var api = new createsend(apiDetails);

        var listId = process.env.CM_SIGNUP_LIST_ID;
        var details = {
            EmailAddress: newUser.email,
            Name: newUser.firstname,
            CustomFields: [
                { Key: 'UniqueIDLink', Value: newUser.id },
                { Key: 'Signup_on_mobile', Value: newUser.signup_on_mobile },
                { Key: 'Cause', Value:newUser.cause_name },
                { Key: 'Influencer', Value: newUser.influencer_username},
                { Key: 'InfluencerID', Value: newUser.influencer_id },
                { Key: 'Source', Value: newUser.source },
                { Key: 'ShareURL', Value: newUser.referral_url  },
                { Key: 'NumberExtensionInstalls', Value: 0},
                { Key: 'NumberClicks', Value: 0 },
                { Key: 'NumberTransactions', Value: 0 },
                { Key: 'NumberImpacts', Value: 0  }
            ]
        };
        //Add the new user as a subscriber to the list
        api.subscribers.addSubscriber(listId, details, (err, res) => {
            if (err) console.log(err);
            //if (res) console.log(res);
        });
    }
    async postNewUserToSlack(user){

        if(!process.env.SLACK_WEBHOOK)
        {
            console.log("error, no slack webhook in ev vars.")
        }

        const Slack = require('slack-node')
        const slack = new Slack()
        slack.setWebhook(process.env.SLACK_WEBHOOK)
        var default_opts = {
            channel: '#folo-signups',
            username: 'JeevesBot',
        }

        // post firstname, email, and influencer_username
        let post_str = "";
        if(process.env.NODE_ENV=="production")post_str+=":folo:";
        let un =  user.influencer_username || "";
        let cn = user.cause_name || "";
        post_str+= user.firstname+ " "+ user.email+ " :by: "+un+" :cause: "+cn
        
        default_opts.text = process.env.NODE_ENV+" "+post_str;//user.email;
        //merge both - warning this is es6 so check production env
        //Object.assign(default_opts, opts);

        slack.webhook(default_opts, function(err, response) {
            if (err) {
                console.log('error', 'slack', response)
            }
        })
    }

    async generateUserReferralUrl(alias, cause_name)
    {
        var app_url = process.env.APP_URL || 'https://folo.world';
        if(cause_name)return app_url+"/"+cause_name +'/@' + alias;
        else return app_url+'/@' + alias;
    }

    async  createSignupTransaction(user)
    {
         // pull product 1 from the DB
         let [product] = await db("products").select('*').where({id:1})
        
         if(!product) return;

         let transaction = new Transaction();
         transaction.user_id             = user.id;
         transaction.trackingid          = product.name+"-"+user.id
         transaction.merchantid          = product.merchant_id
         transaction.transactionamount   = 0
         transaction.moneybackamount     = 0
         transaction.commissionamount    = product.amount
         transaction.currency            = product.currency
         transaction.validated = transaction.tracking = transaction.received = "Y"
         transaction.status = "Approved"
    
         transaction.additionalinfo = "Signup Bonus"
         transaction.createtimestamp = transaction.modifytimestamp = transaction.approvedtimestamp = new Date()

         transaction.aggregator_merchant_id = product.aggregator_merchant_id
         transaction.aggregator_merchant_name = product.aggregator_merchant_name
         transaction.aggregator_network_id = product.aggregator_network_id

         //transaction.aggregator_transaction_id = data.aggregator_transaction_id
         transaction.aggregator_inserted_at = new Date()
         
         // hardcode these for now, signing up in other geos will result in a diffferent product beign used.
         transaction.user_currency = product.currency
         transaction.user_currency_transactionamount = 0;
         transaction.user_currency_cause_share_amount = transaction.cause_share_amount =product.amount

         let trackingid = await transaction.insert();
    
         console.log("createSignupTransaction", transaction, trackingid)
         // create as a transaction with transaction id from internal, webhooked = 1
    
    
    }
    async oauthSignup(ctx) {
        //First let's save off the ctx.request.body. Throughout this project
        //we're going to try and avoid using the ctx.request.body and instead use
        //our own object that is seeded by the ctx.request.body initially
        const request = ctx.request.body

        //Next do validation on the input
        const validator = joi.validate(request, userOAuthSchemaSignup)
        if (validator.error) {
            ctx.throw(400, validator.error.details[0].message)
        }

        this.genericSignup(request, ctx)
    }
    // Remove as superseeded by authenticate
    async login(ctx) {


        try {
            const request = ctx.request.body

            //console.log("authenticate:"+request )
            const util = require('util')

            if (!request.email) {
                ctx.throw(404, 'INVALID_DATA')
            }else{
                request.email = request.email.toLowerCase();
            }


            
            //var u = new User();
            var userData = await findByEmail(request.email);
            
            if (!userData) {
                ctx.throw(401, 'INVALID_CREDENTIALS')
            }

            //Now let's check the password
            try {
                var correct = false
                const crypto = require('crypto')

                var hash = crypto.createHash('sha256')
                hash.update(userData.challengesalt + request.password)
                if (userData.password == hash.digest('hex')) correct = true

                if (!correct) {
                    ctx.throw(400, 'INVALID_PASSWORD')
                }
            } catch (error) {
                console.log('error creating hash')
                ctx.throw(400, 'INVALID_DATA')
            }

            try {
                var rToken = await this.generateJWTToken(ctx, userData)
            } catch (error) {
                console.log('error generateJWTToken')
                ctx.throw(400, 'INVALID_DATA')
            }
            var app_url = process.env.APP_URL || 'https://folo.world';

            var r_user = {
                is_admin: userData.is_admin,
                id: userData.id,
                username: userData.username,
               // url_name: userData.url_name,
                email: userData.email,
                cause_categories: userData.cause_categories,
                firstname: userData.firstname,
                cause_id : userData.cause_id,
                cause_name : userData.cause_name,
                influencer_id : userData.influencer_id,
                influencer_username : userData.influencer_username,
                referral_url: app_url + userData.username
            }

            if(r_user.id)
            {

                try{
                    //find the latest alias for the user
                    var alias = new AccountAlias()
                    var aliases = await findAliasByAccountId(userData.id,"User");
                    if(aliases)
                    {
                        if(aliases.length)
                        {
                            userData.latest_alias = aliases[0].name;

                            r_user.username= userData.latest_alias,
                            r_user.referral_url= app_url + userData.latest_alias
                        }
                    }
                }catch(e)
                {
                    console.log(e);
                }
            }
            //test setting cookie data 
            //ctx.request.universalCookies.set('user_id', userData.id, { path: '/' });
            try{
                var options = {domain: "folo.world" , httpOnly: false }
                var addonLicense = userData.id+"-"+userData.api_secret;
                //ctx.cookies.set('user_id',userData.id)
               // ctx.cookies.set('v2_user_id',userData.id,options)
                ctx.cookies.set("addonLicense"  ,addonLicense ,    options);
                ctx.cookies.set("addonVariant"  ,"2"  , options);
                ctx.cookies.set("addonRegion"   ,"au"  , options);   // default 1 day after,expire

            }catch(e)
            {
                console.log("UAC","error on cookie")
                console.log(e);
            }
           // console.log("info","login","set cookie",userData.id,ctx.request.universalCookies)
            //And return our response.
            ctx.body = {
                message: 'SUCCESS',
                user: r_user,
                jwt_token: rToken,
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async authenticate(ctx) {
        const request = ctx.request.body

        //console.log("authenticate:"+request )
        const util = require('util')

        if (!request.email) {
            ctx.throw(404, 'INVALID_DATA')
        }else{
            request.email = request.email.toLowerCase();
        }


            //var u = new User();
            var userData = await findByEmail(request.email);
           // console.log("authenticate",userData);
        if (!userData) {
            ctx.throw(401, 'INVALID_CREDENTIALS')
        }

        //Now let's check the password
        try {
            var correct = false
            const crypto = require('crypto')

            var hash = crypto.createHash('sha256')
            hash.update(userData.challengesalt + request.password)
           if (userData.password == hash.digest('hex')) correct = true

            if (!correct) {
                ctx.throw(400, 'INVALID_PASSWORD')
            }
        } catch (error) {
            ctx.throw(400, 'INVALID_PASSWORD')
        }

        try{
            let options={overwrite:true, httpOnly: false,domain:"folo.world"}
            // -- testing cookie dropping from server to be picked up by extension
            let addonLicense = userData.id + "-" + userData.api_secret;
            ctx.cookies.set('addonLicense', addonLicense, options)
            ctx.cookies.set('addonVariant', 2, options)
            ctx.cookies.set('addonRegion','au' , options)

        }catch(e)
        {
            console.log("/authenticate cookie drop ",e)
        }

        var rToken = await this.generateJWTToken(ctx, userData)
        ctx.body = rToken /*{
            access_token: token,
            refresh_token: refreshTokenData.refresh_token,
        }*/
    }

    async generateJWTToken(ctx, userData) {

        //Generate the refreshToken data
        let refreshTokenData = {
            email: userData.email,
            refresh_token: new rand(/[a-zA-Z0-9_-]{64,64}/).gen(),
            info:
                ctx.userAgent.os +
                ' ' +
                ctx.userAgent.platform +
                ' ' +
                ctx.userAgent.browser,
            ip_address: ctx.request.ip,
            expiration: dateAddMonths(new Date(), 1),
        }

        //Insert the refresh data into the db
        try {
            await legacy_db('refresh_tokens_v2').insert(refreshTokenData)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }

        //Update their login count
        //console.log("info","generateJWTToken",userData.id )
        try {
            await legacy_db('users')
                .increment('login_count')
                .where({ id: userData.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }


        var filteredUser = {
            id: userData.id,
            email: userData.email,
            is_admin: userData.is_admin,
            api_secret: userData.api_secret
        };

        //Ok, they've made it, send them their jsonwebtoken with their data, accessToken and refreshToken
        const token = jsonwebtoken.sign(
            { data: filteredUser },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME }
        )

        return {
            access_token: token,
            refresh_token: refreshTokenData.refresh_token,
        }
    }
    
    async refreshAccessToken(ctx) {
        const request = ctx.request.body
        if (!request.email || !request.refresh_token)
            ctx.throw(401, 'NO_REFRESH_TOKEN')

        //Let's find that user and refreshToken in the refreshToken table
        const [refreshTokenDatabaseData] = await legacy_db('refresh_tokens_v2')
            .select('email', 'refresh_token', 'expiration')
            .where({
                email: request.email,
                refresh_token: request.refresh_token,
                is_valid: false,
            })
        if (!refreshTokenDatabaseData) {
            ctx.throw(400, 'INVALID_REFRESH_TOKEN')
        }

        //Let's make sure the refreshToken is not expired
        const refreshTokenIsValid = dateCompareAsc(
            dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            refreshTokenDatabaseData.expiration
        )
        if (refreshTokenIsValid !== -1) {
            ctx.throw(400, 'REFRESH_TOKEN_EXPIRED')
        }

        // console.log(refreshTokenDatabaseData)

        //Ok, everthing checked out. So let's invalidate the refresh token they just confirmed, and get them hooked up with a new one.
        try {
            await legacy_db('refresh_tokens_v2')
                .update({
                    is_valid: false,
                    updated_at: dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
                })
                .where({ refresh_token: refreshTokenDatabaseData.refresh_token })
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA1')
        }

        const [userData] = await legacy_db('users')
            .select('id', 'api_secret', 'email', 'is_admin')
            .where({ email: request.email })
        if (!userData) {
            ctx.throw(401, 'INVALID_REFRESH_TOKEN')
        }

        //Generate the refreshToken data
        let refreshTokenData = {
            email: userData.email,
            refresh_token: new rand(/[a-zA-Z0-9_-]{64,64}/).gen(),
            info:
                ctx.userAgent.os +
                ' ' +
                ctx.userAgent.platform +
                ' ' +
                ctx.userAgent.browser,
            ip_address: ctx.request.ip,
            expiration: dateAddMonths(new Date(), 1),
        }

        //Insert the refresh data into the db
        try {
            await legacy_db('refresh_tokens_v2').insert(refreshTokenData)
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }

        //Ok, they've made it, send them their jsonwebtoken with their data, accessToken and refreshToken
        const token = jsonwebtoken.sign(
            { data: userData },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME }
        )
        ctx.body = {
            access_token: token,
            refresh_token: refreshTokenData.refresh_token,
        }
    }

    async invalidateAllRefreshTokens(ctx) {
        const request = ctx.request.body
        try {
            await db('refresh_tokens_v2')
                .update({
                    is_valid: false,
                    updated_at: dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
                })
                .where({ email: request.email })
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async invalidateRefreshToken(ctx) {
        const request = ctx.request.body
        if (!request.refresh_token) {
            ctx.throw(404, 'INVALID_DATA')
        }
        try {
            await db('refresh_tokens_v2')
                .update({
                    isValid: false,
                    updatedAt: dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
                })
                .where({
                    email: ctx.state.user.email,
                    refresh_token: request.refresh_token,
                })
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async forgot(ctx) {
        const request = ctx.request.body

        if(!request.type)request.type = 'web';

        if (!request.email || !request.url || !request.type) {
            ctx.throw(404, 'INVALID_DATA')
        }

        let resetData = {
            password_reset_token: new rand(/[a-zA-Z0-9_-]{64,64}/).gen(),
            password_reset_expiration: dateAddMinutes(new Date(), 30),
        }

        console.log("api/user/forgot",resetData,request)

        try {
            var result = await legacy_db('users')
                .update(resetData)
                .where({ email: request.email })
                .returning('id')
                console.log("api/user/forgot",result)
            if (!result) {
                ctx.throw(404, 'INVALID_EMAIL')
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

        //Now for the email if they've chosen the web type of forgot password
        if (request.type === 'web') {

            //Campaign Monitor hookup - keep inline for now whilst evalutating
            try{
                var createsend = require('createsend-node');
                var apiDetails = { apiKey: process.env.CM_API_KEY};
                var api = new createsend(apiDetails);

                // Create a details object
                var details = {};
                details.smartEmailID = "450768ce-40f1-4ab7-a2d0-85e4213aa4de"
                details.to = request.email;

                let resetUrlCustom =
                request.url +
                '?password_reset_token=' +
                resetData.password_reset_token +
                '&email=' +
                encodeURIComponent(request.email)

                // Add mail merge variables
                details.data = {
                    "resetUrl": resetUrlCustom
                }  
                api.transactional.sendSmartEmail(details, function (err, res) {
                    if (err) {
                        /*do something*/
                        console.log("error","error sending transaction email through CM",err)
                    } else {
                        /*do something*/
                        console.log("info","success sending transaction email through CM")
                    }
                });

            }catch(e)
            {
                console.log(e)
            }
        }

        ctx.body = { message: 'SUCCESS' };//password_reset_token: resetData.password_reset_token }
    }

    async checkPasswordResetToken(ctx) {
        const request = ctx.request.body

        if (!request.password_reset_token || !request.email) {
            ctx.throw(404, 'INVALID_DATA')
        }

        let [passwordResetData] = await legacy_db('users')
            .select('password_reset_expiration')
            .where({
                email: request.email,
                password_reset_token: request.password_reset_token,
            })
        if (!passwordResetData) {
            ctx.throw(404, 'INVALID_TOKEN')
        }

        //Let's make sure the refreshToken is not expired
        var tokenIsValid = dateCompareAsc(
            dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            passwordResetData.password_reset_expiration
        )
        if (tokenIsValid !== -1) {
            ctx.throw(400, 'RESET_TOKEN_EXPIRED')
        }

        ctx.body = { message: 'SUCCESS' }
    }

    async resetPassword(ctx) {
        const request = ctx.request.body

        //First do validation on the input
        const validator = joi.validate(request, userSchemaResetPassword)
        if (validator.error) {
            ctx.throw(400, validator.error.details[0].message)
        }

        //Ok, let's make sure their token is correct again, just to be sure since it could have
        //been some time between page entrance and form submission
        let [passwordResetData] = await legacy_db('users')
            .select('password_reset_expiration')
            .where({
                email: request.email,
                password_reset_token: request.password_reset_token,
            })
        if (!passwordResetData) {
            ctx.throw(404, 'INVALID_TOKEN')
        }

        var tokenIsValid = dateCompareAsc(
            dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            passwordResetData.password_reset_expiration
        )
        if (tokenIsValid !== -1) {
            ctx.throw(400, 'RESET_TOKEN_EXPIRED')
        }

        //Ok, so we're good. Let's reset their password with the new one they submitted.

        //Hash it
        try {
           // request.password = await bcrypt.hash(request.password, 12)


            const crypto = require('crypto')
            request.challengesalt = crypto.randomBytes(12).toString('hex')
            //Ok now let's hash their password.
            try {
                var hash = crypto.createHash('sha256')
                hash.update(request.challengesalt + request.password)//don't use user entered password from here onwards
                request.password = hash.digest('hex')
            } catch (error) {
                console.log(error)
                ctx.throw(400, 'INVALID_PASSWORD')
            }
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }

        //Make sure to null out the password reset token and expiration on insertion
        request.password_reset_token = null
        request.password_reset_expiration = null


        try {
            await legacy_db('users')
                .update({
                    challengesalt: request.challengesalt,
                    password: request.password,
                    password_reset_token: request.password_reset_token,
                    password_reset_expiration: request.password_reset_expiration,
                })
                .where({ email: request.email })
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
        ctx.body = { message: 'SUCCESS' }
    }

    async private(ctx) {
        ctx.body = { user: ctx.state.user }
    }

    //Helpers
    async generateUniqueToken() {
        let token = new rand(/[a-zA-Z0-9_-]{7,7}/).gen()

        if (await this.checkUniqueToken(token)) {
            await this.generateUniqueToken()
        } else {
            return token
        }
    }

    async checkUniqueToken(token) {
        let result = await legacy_db('users')
            .where({
                token: token,
            })
            .count('id as id')
        if (result[0].id) {
            return true
        }
        return false
    }

    async getUserAgentFromRequest(ctx)
    {
        ctx.body = await this.getBrowserFromUserAgent(ctx.userAgent)
    }

    async getBrowserFromUserAgent(userAgent)
    {
        let r_obj = {
            browser:""
        }

        r_obj.browser  = userAgent;
        if(userAgent)
        {
            r_obj.browser   = userAgent.browser;
            r_obj.is_mobile = userAgent.isMobile,
            r_obj.is_tablet = userAgent.isTablet,
            r_obj.is_desktop= userAgent.isDesktop
        }

        return r_obj;
    }
}

export default UserController
