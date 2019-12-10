
import dateFormat from 'date-fns/format'
import legacy_db from '../db/legacy_db'
import { User, getUserBalance, getUserTransactionTotals} from '../models/User'
import { Merchant } from '../models/Merchant';
import { Click } from '../models/Click';
import logger from '../logger/log'

class LegacyAPIController {

    async getVersion(ctx) {
        const query = ctx.query;
        const user = new User(ctx.state.user)

        try {

            ctx.body = {version:2};
        
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async getUsefulLinks(ctx) {
        const query = ctx.query;
        const user = new User(ctx.state.user)

        try {
            var links = {
                "About Folo":"http://au.folo.world/about",
                "Browse All Stores":"https://au.folo.world/our-stores/All/All/Popularity/1",
                "Contact Us":"https://au.folo.world/contact",
                "Help":"https://au.folo.world/faq",
                "Latest Deals":"http://au.folo.world/deals-vouchers",
                "Your Folo Account":"https://au.folo.world/account"
            }

            ctx.body = {'useful-links':links};
        
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async getSettings(ctx)
    {
        /* v1 bar defaults
        DEFAULT_LICENSE: '105775-19fc621a1d185b18f53313e239338ed4',
        UPDATE_INTERVAL: 30 * 60 * 1000, // 30min
        ACTIVATE_TIMEOUT: 20 * 1000, // 20sec
        ACTIVE_TIMEOUT: 30 * 60 * 1000, // 30min
        pollsettingstimeout: 300000,
        reloadstorestimeout: 10800000,
        */
        //console.log("getSettings")
        try {
            var settings = [{
                pollsettingstimeout: 300000,
                reloadstorestimeout: 10800000,
                visitdatacollection: false
            }]
            ctx.body = {settings}
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }


    }

    async getUserTransactionTotal(ctx)
    {
        const user = new User(ctx.state.user)
        try {
            /*
            cashback-to-date:
                amount:"18.29"
            */
           let totals = await getUserTransactionTotals(user.id)
           let amount = totals.total || "0.00"; 
           //console.log("getUserTransactionTotal",totals,amount)
            ctx.body = {"cashback-to-date": {amount:amount}}
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

    }

    async getUserSubID(user)
    {
        return "User_"+user.id;
    }

    async getMerchantActivateLink(merchant_network_url, user)
    {
        if(!merchant_network_url)
            return

        var  placeholder = "__MBC_TRACKING_INFO_HERE__"
        let sid = await this.getUserSubID(user);
    
        return merchant_network_url.replace(placeholder,sid);
        
    }

    async getMerchantStore(merchant_id, user)
    {
        logger.log("getMerchantStore",merchant_id)
        try{

            var [merchant] = await legacy_db('merchants')
            .select('*')
            .where({id:merchant_id })
            .limit(1)

            if(!merchant)return
            return await this.getFormatMerchantForResponse(merchant, user);
        } catch (error) {
            console.log(error)
        }
    }

    async getFormatMerchantForResponse(merchant, user)
    {
        var whitelist_props = ['id','name','description','additionalinfo','conditions','websiteurl','ratingscore','searchtags','clickthrucount']
        var rev_share = 0.5; // 70/30 - cause/folo - ToDo: set this globally for easier reference
       
        let clean_merchant = {
            category: merchant.sector,
            popularity: merchant.clickthrucount,
        }

        //apply whitelist
        for(var j=0;j<whitelist_props.length;j++)
        {
            let prop = whitelist_props[j]
            clean_merchant[prop] = merchant[prop];
        }

        // commission percantage - relative to user  //'value' => $commissionTier->getOutputFomatted("AUD", $this, $this->container, $this->region),

        var formatted_value = ""
        //work out commission 
        if(merchant.moneyvaluef)
        {
            var currencyFormatter = require('currency-formatter');
            // Apply rev share, then currency symbol and 2 decimal points                    
            formatted_value = currencyFormatter.format(merchant.moneyvaluef* rev_share, { code: 'AUD' });
        }
        // if it's a % revshare, then check FOLO column first then try the Pricepal (default) column
        let percent =  merchant.percentagevaluef
        if(percent) { 
            formatted_value = (Math.round(((percent* rev_share) * 100) )/ 100)+"%";
        }
/*
        if(merchant.id ==3652)
        {
            console.log(merchant, percent, formatted_value)
        }*/

        clean_merchant.value =  formatted_value;

        clean_merchant.storepagelink = "/visit/"+merchant.displayname;
        clean_merchant.visitlink = "/visit/"+merchant.id+"/"+user.id

        // if FOLO url exists then use that, otherwise falback top the Pricepal one
        let m_url = merchant.folo_url || merchant.url;
        clean_merchant.networklink = await this.getMerchantActivateLink(m_url, user)

        // Removed redirector temporarily by sending user straight to merchants network link
        //clean_merchant.visitlink = clean_merchant.networklink

        clean_merchant.popularity = merchant.clickthrucount;
        clean_merchant.description = merchant.clickthrucount = "";
        //removed to reduce wieght of response as data was not used in clients in v1, starting with bare minimum and working up.
       var cause_name = "your chosen cause"
       //clean_merchant.preactivatedtext =  "Folo donates to "+cause_name+" when you shop here.  Click to activate >>"
       //clean_merchant.activatedtext = "Up to "+formatted_value+" donation activated for "+cause_name;//Blue Dragon Children's Foundation"
       //clean_merchant.activatedtextdetails // '<div>HTML text in here</div>',
       //clean_merchant.serptext = "Folo gives up to "+formatted_value+" to your cause when you shop at "+merchant.name
       clean_merchant.serplink = merchant.websiteurl;// "https://classcoach.com.au/"

       let cdn_url = "https://s3-ap-southeast-2.amazonaws.com/starthere-assets/";//http://cdn.starthere.com.au/files/causes/
       clean_merchant.logolink    =      cdn_url+"files/logos/"+merchant.id+".gif "

       
       //clean_merchant.largelogolink   =cdn_url+"files/logos/large_"+merchant.id+".gif"
        return clean_merchant;
    }

    async getStoresByCategory(ctx)
    {
        const user = new User(ctx.state.user)

        var params = ctx.params;
        var category_id = params.category_id

        // if is a top level category, then get all sub categories, then get all merchants with those categories
        

        var merchants=[]
        try{

            var merchantCats = await legacy_db('merchant_categories')
            .select('merchant_id as id')
            .where({category_id: category_id})
            // each element will be {id:X} so map to new array of numbers
            const merchant_ids = merchantCats.map(x => x.id);
            
            merchants= await legacy_db('merchants')
            .select('*')
            .whereIn('id',merchant_ids)
            .andWhere({status:"ACTIVE", wl_folo_available:1})
            .orderBy('clickthrucount','DESC')
            .limit(1000)
            // map to new array of formatted merchant objects
            merchants = await Promise.all(merchants.map(async (m) => {
                return await this.getFormatMerchantForResponse(m, user)
            }))

        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

        //console.log('getStoresByCategory',merchants.length)
        ctx.body = merchants;
    }

    async getStores(ctx)
    {
        const user = new User(ctx.state.user)

        try{

            var merchants = await legacy_db('merchants')
            .select('*')
            .where({status:"ACTIVE", wl_folo_available:1})
            .orderBy('clickthrucount','DESC')
            .limit(1000)
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

        var clean_merchants = [];

        try {
            //add any extras
            for(var i=0;i<merchants.length;i++)
            {
                let merchant = merchants[i];
                let clean_merchant = await this.getFormatMerchantForResponse(merchant, user)

                // add category ids to the merchant. Removed for now until caching is implemented as creates too long a delay
/*
                clean_merchant.categories = [];
               let mcs =  await legacy_db('merchant_categories').where({ merchant_id: merchant.id})
               clean_merchant.categories = mcs;
               
               /*for(var c=0;c<mcs.length;c++)
               {
                clean_merchants.categories.push(await legacy_db('categories').where({ id: mcs[c].category_id}));
               }*/
               clean_merchants.push(clean_merchant);
            }
            
            ctx.body = {"stores": clean_merchants}
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
        
    }

    async getMerchantCategories(ctx)
    {
        var query = ctx.query;
        var params = ctx.params;

        // if category_id is present then only return it's children
        var categories = []
        // get top level categories
        try{

             categories =  await legacy_db('categories')
            .where({ parent_id: null})

            for(var c=0;c<categories.length;c++)
            {
                categories[c].sub_categories =  await legacy_db('categories').where({ parent_id: categories[c].id})
                // tidy up top level categories
                delete categories[c].parent;
                delete categories[c].parent_id;
            }

        }catch(error)
        {
            console.log(error)
        }

        ctx.body = categories
        
    }

    async actionUserClick(ctx)
    {
       
        var query = ctx.query;
        var model_type = params.model_type       
        var model_id = params.model_id
        const user = new User(ctx.state.user)
        const merchant = new Merchant();

        //database vars
        var db_name = model_type.toLowerCase()+'s'
        var table_name = model_type=='merchant'?'clickthrucount':'click_through_count'
        
        try{
            /*await merchant.find(merchant_id);
            //increment merchant clickthrough
            merchant.clickthrucount++;
            await merchant.update();*/

            let increment =  await legacy_db(db_name)
            .increment(table_name)
            .where({ id: model_id})

        }catch(error)
        {
            logger.error(error)
        }

        try{
            var click = new Click({
                user_id: user.id,
                model_type: model_type,
                model_id: model_id,
                ipaddress: ctx.request.ip,
                app_type: 'FOLO-Bar',
                app_version: 2,
                platform_type: 'folo',
                platform_version: 2,
                version:2
            })
            await click.insert();
        }catch(error)
        {
            logger.error(error)
        }

        ctx.body = { message: 'SUCCESS' }
        /*

            $clickThroughCount = $merchant->getClickthrucount() + 1;
            $merchant->setClickthrucount($clickThroughCount);

            $this->getDoctrine()->getManager()->persist($merchant);

            $click = null;

            switch($this->region)
            {
                case RegionType::AU:
                default:
                    $click = new Clicks();
                    break;
                case RegionType::US:
                    $click = new UsClicks();
                    break;
            }

            $click->setUserId($this->m_user->getId());
            $click->setMerchantid($merchant->getId());
            $click->setClicktimestamp(new \DateTime("now", new \DateTimeZone("Australia/Brisbane")));
            $click->setIpaddress(Utility::getClientIp($this));
            $click->setVersion(3);

            $this->getDoctrine()->getManager()->persist($click);

            $this->getDoctrine()->getManager()->flush();

            SegmentioHelper::newTrack($this, $this->container, $this->m_user->getId(), SegmentioEventType::StoreVisitViaExtension, array('store_id' => $merchant->getId(), 'store_name' => $merchant->getName()));

            CompetitionHelper::addUserEntriesForAction($this, $this->container, $this->m_user, PricePalCompetitionActionType::Click);
            GamificationHelper::addPointsForAction($this, $this->container, GamificationActionType::PricePalClick, 0, $this->m_user);
            */
    }
    // ensure to only return vouchers for merchants that are valid otehrwise it will crash the extension
    async getAllStoreVouchers(ctx)
    {
        //console.log("getAllStoreVouchers")
        var vouchers = [];

        try{

            // written raw SQL for now as Redis cache is not yet live
            var [raw_vouchers] = await legacy_db.raw('SELECT vouchers.id, vouchers.code, vouchers.merchant_id, vouchers.title, vouchers.end_date from vouchers, merchants where vouchers.merchant_id = merchants.id and vouchers.status="ACTIVE" and merchants.status="ACTIVE" and wl_folo_available=1 and vouchers.end_date > Date(NOW()) order by id DESC')

            //console.log(raw_vouchers);
            /*var raw_vouchers = await legacy_db('vouchers')
            .select('*')
            .where({status:"ACTIVE" })//folo_addon_serp_na , folo_addon_alert_na
            .orderBy('id','DESC')
            .limit(5)*/

            for(var i=0;i<raw_vouchers.length;i++)
            {
                let raw_voucher = raw_vouchers[i];


                vouchers.push({
                    code:           raw_voucher.code,
                    code_id:        raw_voucher.id,
                    merchant_id:    String(raw_voucher.merchant_id),
                    conditions:     "",//raw_voucher.conditions,
                    title:          raw_voucher.title,
                    description:    "",//raw_voucher.description,
                    expires:{ 
                        date: dateFormat( new Date(raw_voucher.end_date), 'YYYY-MM-DD HH:mm:ss'),//"2018-06-30 23:59:59"
                        timezone_type:3,
                        timezone:"UTC"
                    }
                })
            }

            /*var testVoucher = 
                {"merchant_id":"1750","code_id":10278,"title":"20% off all full priced styles",
"description":"20% off all full price stylesNot to be used in conjunction with any other offerMust use promocode at checkoutOffer available at www.adorne.com.au onlyOffer valid until 30th June 2018 midnight AEST",
"conditions":"Terms & Conditions apply, see website for details.",
"code":"ALLS20","expires":{"date":"2018-06-30 23:59:59","timezone_type":3,"timezone":"UTC"}}*/
            
        //console.log("getAllStoreVouchers",vouchers.length)
            ctx.body = {"vouchers":vouchers};//[testVoucher]}
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

        /*
        code:"ALLS20"
        code_id:10278
        conditions:"Terms & Conditions apply, see website for details."
        description:"20% off all full price stylesNot to be used in conjunction with any other offerMust use promocode at checkoutOffer available at www.adorne.com.au onlyOffer valid until 30th June 2018 midnight AEST"
        expires:{date: "2018-06-30 23:59:59", timezone_type: 3, timezone: "UTC"}
        merchant_id:"3977"
        title:"20% off all full priced styles"*/
    }


    // ToDo: abstract into Merchant class once settled
    async getMerchantVouchers(merchant_id)
    {
        let vouchers = [];

        try{
            var raw_vouchers = await legacy_db('vouchers')
            .select('*')
            .where({merchant_id: merchant_id, status:"ACTIVE" })//folo_addon_serp_na , folo_addon_alert_na
            //.andWhere('expire_date',"<",dateFormat( new Date(), 'YYYY-MM-DD'))
            .orderBy('id','DESC')
            .limit(10)

            for(var i=0;i<raw_vouchers.length;i++)
            {
                let raw_voucher = raw_vouchers[i];
                vouchers.push({
                    code:           raw_voucher.code,
                    code_id:        raw_voucher.id,
                    merchant_id:    String(raw_voucher.merchant_id),
                    conditions:     raw_voucher.conditions,
                    title:          raw_voucher.title,
                    description:    raw_voucher.description,
                    expires:{ 
                        date: dateFormat( new Date(raw_voucher.end_date), 'YYYY-MM-DD HH:mm:ss'),//"2018-06-30 23:59:59"
                        timezone_type:3,
                        timezone:"UTC"
                    }
                })
            }
            
        } catch (error) {
            console.log(error)
        }

        return vouchers;
    }

    async getMerchantOffers(merchant_id)
    {
        let offers = [];

        /*var offer = {
            conditions:"1-Terms & Conditions apply, see website for details.",
            description:"1-Save up to 30% when you book a Loved by Guests property.<br></br>Travel Date: 23 Apr - 31 July",
            expires:{date: "2018-05-23 23:59:59", timezone_type: 3, timezone: "UTC"},
            merchant_id: "1750",
            title:"1-Loved by Guests"
        }*/
        // merchant_specials
        try{
            var raw_offers= await legacy_db('merchant_specials')
            .select('*')
            .where({merchant_id: merchant_id, status:"ACTIVE" })//folo_addon_serp_na , folo_addon_alert_na
            .andWhere('end_date',"<",dateFormat( new Date(), 'YYYY-MM-DD HH:mm:ss'))
            .andWhere('start_date',">=",dateFormat( new Date(), 'YYYY-MM-DD HH:mm:ss'))
            .orderBy('id','DESC')
            .limit(100)
            for(var i=0;i<raw_offers.length;i++)
            {
                let raw_offer = raw_offers[i];
                offers.push({
                    title:          raw_offer.title,
                    merchant_id:    raw_offer.merchant_id,
                    conditions:     raw_offer.conditions,
                    description:    raw_offer.description,
                    expires:{ 
                        date: dateFormat( new Date(raw_offer.end_date), 'YYYY-MM-DD HH:mm:ss'),//"2018-06-30 23:59:59"
                        timezone_type:3,
                        timezone:"UTC"
                    }
                })
            }

        } catch (error) {
            console.log(error)
        }


        

        return offers;
    }

    async getMerchantDetails(ctx)
    {
        var query = ctx.query;
        var params = ctx.params;
        var merchant_id = params.merchant_id;
        const user = new User(ctx.state.user)

        var response = {
            alternatives:[],
            offers:     await this.getMerchantOffers(merchant_id),
            reviews:        [],
            store:      await this.getMerchantStore(merchant_id, user),
            vouchers:   await this.getMerchantVouchers(merchant_id)
        };

        // alternatives - not yet implemented
        response.alternatives = [];

        

        // reviews
        
        // store


        ctx.body = response;
/*
alternatives:[]
offers:[{…}]
reviews:{
    numreviews: 142, 
    overallrating: 4.7, 
    numrecommended: 127, 
    reviewsurl: "https://au.folo.world/store-reviews/Hotels-com", 
    Speed of delivery: 4.8, …}
store:[]
vouchers:[]
    }
    //Offers
    conditions    :    "Terms & Conditions apply, see website for details."
    description    :    "Save up to 30% when you book a Loved by Guests property.<br></br>Travel Date: 23 Apr - 31 July"
    expires    :    {date: "2018-05-23 23:59:59", timezone_type: 3, timezone: "UTC"}
    merchant_id    :    "1750"
    title    :    "Loved by Guests"*/
    }
}

export default LegacyAPIController
