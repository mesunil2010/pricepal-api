import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import withFilter from '../traits/Filter'
import SoftDelete from '../traits/SoftDelete'
import { getUserValue,getUserShare } from '../common/Util';

@SoftDelete
class TempCommission {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                         = data.id
        this.moneyvaluef                = data.moneyvaluef
        this.percentagevaluef           = data.percentagevaluef
        this.merchant_id                = data.merchant_id;
        this.start_date                 = data.start_date
        this.end_date                   = data.end_date
        this.is_deleted                 = data.is_deleted
    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var page = 0
        var cpaIncreases=[]
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            this.filterArg['is_deleted']=0
            cpaIncreases = await legacy_db('temp_commission')
                .select('id', 'moneyvaluef', 'percentagevaluef', 'merchant_id', 'start_date', 'end_date')
                .where(this.filter(this.filterArg))
                .orderBy('id', order)
                .offset(+page * +limit)
                .limit(+limit)
            for(var i=0;i<cpaIncreases.length;i++)
            {
                cpaIncreases[i].start_date = dateFormat(cpaIncreases[i].start_date , "YYYY-MM-DD HH:mm:ss");
                cpaIncreases[i].end_date = dateFormat(cpaIncreases[i].end_date , "YYYY-MM-DD HH:mm:ss");
            }
            return cpaIncreases
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('temp_commission').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('temp_commission')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('temp_commission')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('TempCommission: destroy:' + error)
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
            result.start_date = dateFormat(result.start_date, "YYYY-MM-DD HH:mm:ss");
            result.end_date = dateFormat(result.end_date, "YYYY-MM-DD HH:mm:ss");
            this.constructor(result)
            
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }


    @withFilter
    async count(request) {
        var cpaIncreases
        try {
            [cpaIncreases] = await legacy_db('temp_commission')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return cpaIncreases.totalCount
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('temp_commission')
            .select('id', 'moneyvaluef', 'percentagevaluef', 'merchant_id', 'start_date', 'end_date')
            .where({id: id })
            
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function findActiveByMerchantId(id,user_id) {
    try {
        let [data] = await legacy_db('temp_commission')
            .select('id', 'moneyvaluef', 'percentagevaluef', 'merchant_id')
            .where({merchant_id: id })
            .andWhere('start_date','<',legacy_db.fn.now())
            .andWhere('end_date','>',legacy_db.fn.now())
            .orderBy('id', 'desc')
            .limit(1)
            if(data){
                data.formatted_commission = await getUserValue(data,user_id);
                delete data.moneyvaluef
                delete data.percentagevaluef
                delete data.id
                delete data.merchant_id
            }
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { TempCommission, findById , findActiveByMerchantId}

/*
CREATE TABLE `temp_commission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `date` datetime NOT NULL,
  `type` varchar(30) NOT NULL,
  `transaction_id` bigint(20) DEFAULT NULL,
  `amount` double NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25989 DEFAULT CHARSET=latin1;
*/