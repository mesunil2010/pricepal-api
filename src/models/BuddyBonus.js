import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import withFilter from '../traits/Filter'

class BuddyBonus {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                         = data.id
        this.user_id                    = data.user_id
        this.type                       = data.type;
        this.transaction_id             = data.transaction_id
        this.amount                     = data.amount
        this.status                     = data.status;
        this.date                       = data.date;
    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var page = 0
        var bonuses=[]
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            bonuses = await legacy_db('cashback_bonus_bank')
                .select('id', 'user_id','type', 'transaction_id', 'amount', 'status', 'date')
                .where(this.filter(this.filterArg))
                .orderBy('id', order)
                .offset(+page * +limit)
                .limit(+limit)
            for(var i=0;i<bonuses.length;i++)
            {
                bonuses[i].date = dateFormat(bonuses[i].date , "YYYY-MM-DD HH:mm:ss");
            }
            return bonuses
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('cashback_bonus_bank').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('cashback_bonus_bank')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('cashback_bonus_bank')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('BuddyBonus: destroy:' + error)
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
            this.constructor(result)
            this.date = dateFormat(this.date, "YYYY-MM-DD HH:mm:ss");
            
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findExisingByTransaction(transaction_id) {
        try {
            let [data] = await legacy_db('cashback_bonus_bank')
                .select('id', 'user_id','type', 'transaction_id', 'amount', 'status', 'date')
                .where({transaction_id: transaction_id,type: 'TRANSACTION_BONUS'})
            this.constructor(data)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var bonuses
        try {
            [bonuses] = await legacy_db('cashback_bonus_bank')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return bonuses.totalCount
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('cashback_bonus_bank')
            .select('id', 'user_id','type', 'transaction_id', 'amount', 'status', 'date')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { BuddyBonus, findById }

/*
CREATE TABLE `cashback_bonus_bank` (
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