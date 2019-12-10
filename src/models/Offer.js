
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import withFilter from '../traits/Filter'
import {findStrippedById as findMerchantById} from './Merchant'

class Offer {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                         = data.id
        this.title                      = data.title
        this.type                       = data.type
        this.preface                    = data.preface
        this.postscript                 = data.postscript;
        this.coupon                     = data.coupon;
        this.added_date                 = data.added_date;
        this.valid_from_date            = data.valid_from_date;
        this.expire_date                = data.expire_date;
        this.merchant_id                = data.merchant_id;
        this.status                     = data.status;
        for(var prop in data)
        {
            this[prop] = data[prop]
        }
    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var page = 0
        var offers=[]
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            offers = await legacy_db('offers')
                .select('id','title','type','preface','postscript','coupon','added_date','valid_from_date','expire_date','merchant_id','status')
                .where(this.filter(this.filterArg))
                .orderBy('id', order)
                .offset(+page * +limit)
                .limit(+limit)
            for(var i=0;i<offers.length;i++)
            {
                offers[i].added_date = dateFormat(offers[i].added_date , "YYYY-MM-DD HH:mm:ss");
                offers[i].valid_from_date = dateFormat(offers[i].valid_from_date , "YYYY-MM-DD HH:mm:ss");
                offers[i].expire_date = dateFormat(offers[i].expire_date, "YYYY-MM-DD HH:mm:ss");
                offers[i].merchant = await findMerchantById(offers[i].merchant_id)
            }
            return offers
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('offers').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('offers')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('offers')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Offer: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    async find(id) {
        try {
            let result = await findById(id)
            if (!result) return {}
            this.constructor(result)
            if(this.merchant_id)this.merchant = await findMerchantById(this.merchant_id)
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var offers
        try {
            [offers] = await legacy_db('offers')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return offers.totalCount
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('offers')
            .select('id','title','type','preface','postscript','coupon','added_date','valid_from_date','expire_date','merchant_id','status')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Offer, findById }

/*
CREATE TABLE `offers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL DEFAULT 'COUPON',
  `title` text NOT NULL,
  `preface` text,
  `postscript` text,
  `coupon` text,
  `added_date` datetime NOT NULL,
  `valid_from_date` date DEFAULT NULL,
  `expire_date` date DEFAULT NULL,
  `merchant_id` int(10) unsigned NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=latin1;
 */
