
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import {findById as findMerchantById,findStrippedById as findStrippedMerchantById} from './Merchant'
import {findStrippedByModelInfo as findStrippedMediaById } from '../models/Media';
import withFilter from '../traits/Filter'
import withHistory from '../traits/History'

@withHistory
class Enquiry {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                             =   data.id
        this.serialnum                      =   data.serialnum
        this.type                           =   data.type
        this.user_id                        =   data.user_id
        this.merchant_id                    =   data.merchant_id;
        this.transactiondate                =   data.transactiondate
        this.orderref                       =   data.orderref
        this.transactionamount              =   data.transactionamount
        this.moneybackamount                =   data.moneybackamount
        this.additionalinfo                 =   data.additionalinfo
        this.status                         =   data.status
        this.applicable_level               =   data.applicable_level
        this.applicable_rebate              =   data.applicable_rebate
        this.commission_due                 =   data.commission_due
        this.version                        =   data.version
        this.in_freshdesk                   =   data.in_freshdesk
        this.freshdesk_id                   =   data.freshdesk_id

    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var enquiries
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            enquiries= await legacy_db('enquiries')
                .select('id','serialnum','type','user_id','merchantid as merchant_id','transactiondate','orderref','transactionamount','moneybackamount','additionalinfo','status','applicable_level','applicable_rebate','commission_due','version','in_freshdesk','freshdesk_id','createtimestamp as created_at','modifytimestamp as updated_at')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
            
            for(var i=0;i<enquiries.length;i++)
            {
                //enquiries[i].transactiondate = dateFormat(enquiries[i].transactiondate , "YYYY-MM-DD HH:mm:ss");
                enquiries[i].created_at = dateFormat(enquiries[i].created_at , "YYYY-MM-DD HH:mm:ss");
                enquiries[i].updated_at = dateFormat(enquiries[i].updated_at , "YYYY-MM-DD HH:mm:ss");
                enquiries[i].merchant = await findStrippedMerchantById(enquiries[i].merchant_id)
                enquiries[i].media = await findStrippedMediaById('Enquiry',enquiries[i].id)
            }
            return enquiries
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('enquiries').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('enquiries')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('enquiries')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Enquiry: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var enquiries
        try {

            [enquiries]= await legacy_db('enquiries')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))

            return enquiries.totalCount
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
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findModel(id) {
        try {
            let result = await findById(id)
            if (!result) return {}
            if(result.merchant_id)this.merchant = await findMerchantById(result.merchant_id)
            if(!result.media)result.media=await findStrippedMediaById('Merchant',result.id)
            this.constructor(result)
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('enquiries')
            .select('id','serialnum','type','user_id','merchantid as merchant_id','transactiondate','orderref','transactionamount','moneybackamount','additionalinfo','status','applicable_level','applicable_rebate','commission_due','version','in_freshdesk','freshdesk_id','createtimestamp as created_at','modifytimestamp as updated_at')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Enquiry, findById }

/*
CREATE TABLE `enquiries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Global enquiry ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User ID',
  `serialnum` bigint(20) unsigned NOT NULL,
  `type` char(10) NOT NULL,
  `merchantname` varchar(100) NOT NULL,
  `merchantid` int(11) NOT NULL,
  `transactiondate` varchar(100) NOT NULL,
  `orderref` varchar(100) NOT NULL,
  `transactionamount` varchar(100) DEFAULT NULL,
  `moneybackamount` varchar(100) DEFAULT NULL,
  `additionalinfo` text,
  `applicable_level` char(10) NOT NULL,
  `applicable_rebate` float NOT NULL,
  `commission_due` float NOT NULL,
  `status` char(20) DEFAULT 'Queued',
  `createtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modifytimestamp` timestamp NULL DEFAULT NULL,
  `version` tinyint(4) NOT NULL DEFAULT '1',
  `in_freshdesk` tinyint(1) NOT NULL DEFAULT '0',
  `invoice_file_location` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `serialnum` (`serialnum`)
) ENGINE=InnoDB AUTO_INCREMENT=7012 DEFAULT CHARSET=latin1;
 */
