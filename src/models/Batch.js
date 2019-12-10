
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import { traits,alias } from 'traits-decorator'
import SoftDelete from '../traits/SoftDelete'
import withFilter from '../traits/Filter'
import Media from '../models/Media'

@SoftDelete
class Batch {

    constructor(data) {
        if (!data) {
            return
        }
        this.id                         = data.id
        this.amount                     = data.amount
        this.currency                     = data.currency
        this.created_at                 = data.code
        this.paid_at                    = data.description
        this.status                     = data.status
        this.is_deleted                 = data.is_deleted
        this.notes       = data.notes;
    }

    @withFilter
    async all(request) {

    }


    async insert() {
        try {
            return await legacy_db('batches').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('batches')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('batches')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Batch: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var vouchers
        try {
            [vouchers]= await legacy_db('batches')
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


}
async function findById(id) {
    try {
        let [data] = await legacy_db('batches')
            .select('*')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Batch, findById }