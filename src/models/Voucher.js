
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import { traits,alias } from 'traits-decorator'
import SoftDelete from '../traits/SoftDelete'
import {findStrippedById as findMerchantById} from './Merchant'
import withFilter from '../traits/Filter'

@SoftDelete
class Voucher {

    constructor(data) {
        if (!data) {
            return
        }
        this.id                         = data.id
        this.title                      = data.title
        this.code                       = data.code
        this.description                = data.description
        this.conditions                 = data.conditions;
        this.min_user_level             = data.min_user_level
        this.start_date                 = data.start_date
        this.end_date                   = data.end_date
        this.merchant_id                = data.merchant_id
        this.status                     = data.status
        this.is_deleted                 = data.is_deleted

    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var vouchers
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            this.filterArg['is_deleted']=0
            vouchers= await legacy_db('vouchers')
                .select('id','title','code','description','conditions','min_user_level','start_date','end_date','merchant_id','status','is_deleted')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
            
            for(var i=0;i<vouchers.length;i++)
            {
                vouchers[i].start_date = dateFormat(vouchers[i].start_date , "YYYY-MM-DD HH:mm:ss");
                vouchers[i].end_date = dateFormat(vouchers[i].end_date , "YYYY-MM-DD HH:mm:ss");
                vouchers[i].merchant = await findMerchantById(vouchers[i].merchant_id)
            }
            return vouchers
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }


    async insert() {
        try {
            return await legacy_db('vouchers').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('vouchers')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('vouchers')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Voucher: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var vouchers
        try {
            [vouchers]= await legacy_db('vouchers')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return vouchers.totalCount
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

    async findModel(id) {
        try {
            let result = await findById(id)
            if (!result) return {}
            this.constructor(result)
            if(this.merchant_id)this.merchant = await findMerchantById(this.merchant_id)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('vouchers')
            .select('id','title','code','description','conditions','min_user_level','start_date','end_date','merchant_id','status','is_deleted')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Voucher, findById }

/*
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `merchant_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `conditions` text,
  `min_user_level` varchar(15) NOT NULL DEFAULT 'VISITOR',
  `status` varchar(10) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10974 DEFAULT CHARSET=latin1;
 */
