
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import {findByModelInfo as findMediaById, findStrippedByModelInfo as findStrippedMediaById } from '../models/Media';
import withFilter from '../traits/Filter'

import CacheService from '../cache/CacheService.js'

const ttl = 60 * 60 * 24 // cache for 24 Hour
const cache = new CacheService(ttl) // Create a new cache service 

class Merchant {
    constructor(data) {
        if (!data) {
            return
        }
        //id sync'd to Legacy
        this.id                     = data.id
        this.name                   = data.name// - not to be shown to user network sets. My shop (expires 10th june)
        this.displayname            = data.displayname// - formatted and ready to be shown to user - My Shop
        this.website_url            = data.websiteurl;// their homepage e.g. https://www.myshop.com
        this.url                    = data.url;// activated url https://t.cfjump.com/103/t/48005?Url=https%3a%2f%2fkohle.com.au%2f&UniqueId=__MBC_TRACKING_INFO_HERE__
        this.description            = data.description;
        this.status                 = data.status;
        this.moneyvaluef            = data.moneyvaluef;
        this.percentagevaluef       = data.percentagevaluef;
        this.fixedmoneyvaluef       = data.fixedmoneyvaluef;
        this.fixedpercentagevaluef  = data.fixedpercentagevaluef;
        this.created_at             = data.joindate;

        //it's id from Aggregator db
        this.aggregator_id          = data.aggregator_id;
        this.logo_url               = data.logo_url;
        this.sprite_url             = data.sprite_url;
        this.folo_url               = data.folo_url;

        for(var prop in data)
        {
            this[prop] = data[prop]
        }
/*
        this.legacy_id = data.legacy_id

        this.created_at = data.created_at
        this.network_id = data.network_id
        this.legacy_network_name = data.legacy_network_name
        this.percentage_override = data.percentage_override*/
    }

    @withFilter
    async all(request) {
        var limit = 300
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var category_id = null
        var merchants=[]

        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
                if (request.category_id) category_id = request.category_id
            }

            if(category_id===null) {
                merchants = await legacy_db('merchants')
                .select('id','name','displayname','description','websiteurl as website_url','url', 'clickthrucount as clicks', 'moneyvaluef', 'percentagevaluef', 'fixedpercentagevaluef', 'fixedmoneyvaluef','affiliatenetwork' , 'status', 'joindate as created_at',)
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
            } else {
                var subquery = await legacy_db('merchant_categories').where('category_id',category_id).select('merchant_id as id')

                var inData=[]
                subquery.forEach(function(element) {
                    inData.push(element.id)
                  });

                merchants = await legacy_db('merchants')
                .select('id','name','displayname','description','websiteurl as website_url','url', 'clickthrucount as clicks', 'moneyvaluef', 'percentagevaluef', 'fixedpercentagevaluef', 'fixedmoneyvaluef', 'status', 'joindate as created_at')
                .where(this.filter(this.filterArg))
                .whereIn('id', inData)
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
               
            }

            for(var i=0;i<merchants.length;i++)
            {
                merchants[i].created_at = dateFormat(merchants[i].created_at , "YYYY-MM-DD HH:mm:ss")
                merchants[i].logo_url = "https://d20jwizyxnxawh.cloudfront.net/files/logos/"+merchants[i].id+".gif"
                merchants[i].sprite_url = "https://d20jwizyxnxawh.cloudfront.net/files/sprites/"+merchants[i].id+".png"
                if(!merchants[i].media)merchants[i].media=await findStrippedMediaById('Merchant',merchants[i].id);
                if(!merchants[i].media){
                    merchants[i].media={
                        'name' : merchants[i].id+'.gif',
                        'external_link' : merchants[i].logo_url 
                    }
                }
            }

            return merchants

        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('merchants').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            let merchant_id=this.id
            cache.del(['merchant-'+merchant_id,'merchantModel-'+merchant_id])
            return await legacy_db('merchants')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            let merchant_id=this.id
            cache.del(['merchant-'+merchant_id,'merchantModel-'+merchant_id])
            return await legacy_db('merchants')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Merchant : destroy:' + error)
            throw new Error('ERROR')
        }
    }

    async find(id) {

        let cache_key = 'merchant-' + id
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
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findModel(id) {

        var cache_key = 'merchantModel-' + id
        var cached_str = await cache.get(cache_key)
       
        if (cached_str) {
            let result = JSON.parse(cached_str)
            this.constructor(result)
            return result;
        }

        try {
            let result = await findById(id)
            if (!result) return {}
            
            result.created_at = dateFormat(result.created_at , "YYYY-MM-DD HH:mm:ss")
            if(!result.logo_url)result.logo_url = "https://d20jwizyxnxawh.cloudfront.net/files/logos/"+result.id+".gif"
            if(!result.sprite_url)result.sprite_url = "https://d20jwizyxnxawh.cloudfront.net/files/sprites/"+result.id+".png"
            if(!result.media)result.media=await findStrippedMediaById('Merchant',result.id)
            if(!result.media){
                result.media={
                    'name' : result.id+'.gif',
                    'external_link' : result.logo_url 
                }
            }

            this.constructor(result)
            try{
                await cache.set(cache_key, JSON.stringify(result));
            } catch( err ){
                console.log('Could not be cached')
            }
            
           
            
            //console.log("Merchant",'find',id, result.website_url, this.website_url)
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findByAggregatorId(aggregator_id) {
        try {
            let [row] = await legacy_db('merchants')
                .select('*')
                .where({ aggregator_id: aggregator_id })

            if (!row) return {}
            this.constructor(row)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }


    @withFilter
    async count(request) {

        var category_id = null
        var merchants=[]

        try {
            if (request) {
                if (request.category_id) category_id = request.category_id
            }
            if(category_id===null) {
                [merchants] = await legacy_db('merchants')
                .count( '* as totalCount')
                .where(this.filter(this.filterArg))
                
            } else {
                var subquery = await legacy_db('merchant_categories').where('category_id',category_id).select('merchant_id as id')

                var inData=[]
                subquery.forEach(function(element) {
                    inData.push(element.id)
                  });

                [merchants] = await legacy_db('merchants')
                .count( '* as totalCount')
                .whereIn('id', inData)  
            }

            return merchants.totalCount

        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}

async function findById(id) {
    try {
        let [data] = await legacy_db('merchants')
            .select('id','name','displayname', 'description', 'websiteurl as website_url','url','clickthrucount as clicks','moneyvaluef', 'percentagevaluef', 'fixedpercentagevaluef', 'fixedmoneyvaluef', 'affiliatenetwork', 'status', 'joindate as created_at')
            .where({id: id })// status:"ACTIVE", 
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR : Merchant not found')
    }
}

async function findStrippedById(id) {
    try {
        let [data] = await legacy_db('merchants')
            .select('id','name','displayname','websiteurl as website_url')
            .where({id: id })// status:"ACTIVE", 
            if (typeof data !== 'undefined') {
                if(!data.media)data.media=await findStrippedMediaById('Merchant',data.id);
                if(!data.media && data.id){
                    data.media={
                        'name' : data.id+'.gif',
                        'external_link' : "https://d20jwizyxnxawh.cloudfront.net/files/logos/"+data.id+".gif"
                    }
                }
              }
         
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR : Merchant not found')
    }
}

async function getAllCategories() {
    try {
        let categories = await legacy_db('categories')
            .select('id','category')
            .where({parent_id: null }) 

            for(var i=0;i<categories.length;i++)
            {
                categories[i].child = await legacy_db('categories')
                .select('id','category')
                .where({parent_id: categories[i].id }) 
            }
        return categories
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

class Product {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                     = data.id
        this.name                   = data.name
        this.details                = data.details
        this.moneyvaluef            = data.moneyvaluef
        this.percentagevaluef       = data.percentagevaluef
        this.created_at             = data.created_at
        this.updated_at             = data.updated_at

    }

    @withFilter
    async all(request) {
        var limit = 300
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var products=[]

        if(!request.merchant_id)
            return

        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }

            this.filterArg['merchant_id']=request.merchant_id
            products = await legacy_db('merchant_products')
                .select('id','name','moneyvaluef','percentagevaluef','details')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)

            return products

        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }

        

    }

    async insert() {
        try {
            return await legacy_db('merchant_products').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('merchant_products')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('merchant_products')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Merchant : destroy:' + error)
            throw new Error('ERROR')
        }
    }

    async find(id) {
        try {
            let result = await findProductsById(id)
            if (!result) return {}
            this.constructor(result)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
}

async function findProductsById(id) {
    try {
        let [data] = await legacy_db('merchant_products')
            .select('id','name','moneyvaluef','percentagevaluef','details')
            .where({id: id })// status:"ACTIVE", 
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR : Merchant not found')
    }
}

async function findProductsByMerchantId(merchant_id) {
    try {
        let products = await legacy_db('merchant_products')
            .select('id','name','moneyvaluef','percentagevaluef','details')
            .where({merchant_id: merchant_id }) 
        return products
    } catch (error) {
        console.log(error)
        throw new Error('ERROR : Merchant not found')
    }
}



export { Merchant, findById, findStrippedById, getAllCategories, Product, findProductsById, findProductsByMerchantId }
/**
 CREATE TABLE `merchants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
  `displayname` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
  `couponname` varchar(50) DEFAULT NULL,
  `sector` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
  `websiteurl` text CHARACTER SET ascii,
  `joindate` date NOT NULL DEFAULT '0000-00-00',
  `url` text CHARACTER SET ascii COLLATE ascii_bin,
  `linktext` text CHARACTER SET ascii COLLATE ascii_bin,
  `impressionimageurl` text CHARACTER SET ascii COLLATE ascii_bin,
  `cookieinfo` text CHARACTER SET ascii,
  `cookieexpiry` date DEFAULT NULL,
  `cookievalidity` tinyint(3) unsigned DEFAULT NULL,
  `description` text CHARACTER SET ascii NOT NULL,
  `conditions` text CHARACTER SET ascii,
  `additionalinfo` text CHARACTER SET ascii,
  `moneyvaluef` float DEFAULT NULL,
  `percentagevaluef` float DEFAULT NULL,
  `impressioncount` bigint(20) unsigned NOT NULL DEFAULT '0',
  `clickthrucount` bigint(20) unsigned NOT NULL DEFAULT '0',
  `status` varchar(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  `affiliatenetwork` varchar(20) NOT NULL DEFAULT 'clixGalore',
  `acceptenquiries` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `acceptexistingenquiries` tinyint(1) NOT NULL DEFAULT '1',
  `fixedpercentagevaluef` float DEFAULT NULL,
  `fixedmoneyvaluef` float DEFAULT NULL,
  `productfeed` varchar(30) DEFAULT NULL,
  `country` char(2) NOT NULL DEFAULT 'AU',
  `currency` char(3) NOT NULL DEFAULT 'AUD',
  `currenttiercommissions` text,
  `tiercommissionshistory` mediumtext,
  `alwaysusecommission` tinyint(1) NOT NULL DEFAULT '0',
  `dontpromoterebate` tinyint(1) NOT NULL DEFAULT '0',
  `seotitle` text,
  `seodescription` text,
  `seocontent` text,
  `showincarousel` tinyint(1) NOT NULL DEFAULT '0',
  `leadgenonly` tinyint(1) NOT NULL DEFAULT '0',
  `searchtags` text CHARACTER SET ascii,
  `ratingscore` float DEFAULT NULL,
  `specialrate` tinyint(1) NOT NULL DEFAULT '0',
  `freeshipping` tinyint(1) NOT NULL DEFAULT '0',
  `freereturns` tinyint(1) NOT NULL DEFAULT '0',
  `mobileenabled` tinyint(1) NOT NULL DEFAULT '0',
  `addon_serp_na` tinyint(1) NOT NULL DEFAULT '0',
  `addon_alert_na` tinyint(1) NOT NULL DEFAULT '0',
  `wl_checkin_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_keepgiving_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_yourchoyce_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_chaching_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_netbenefits_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_travelfactory_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_rosesonly_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_greatsites_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_rewardsfromus_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_memberrewards_available` tinyint(1) NOT NULL DEFAULT '1',
  `wl_folo_available` tinyint(1) NOT NULL DEFAULT '1',
  `pricepal_available` tinyint(1) NOT NULL DEFAULT '1',
  `folo_addon_serp_na` tinyint(1) NOT NULL DEFAULT '0',
  `folo_addon_alert_na` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `displayname` (`displayname`),
  FULLTEXT KEY `name_2` (`name`,`displayname`,`description`,`sector`,`websiteurl`,`cookieinfo`),
  FULLTEXT KEY `searchtags` (`searchtags`)
) ENGINE=MyISAM AUTO_INCREMENT=4023 DEFAULT CHARSET=latin1;

 */