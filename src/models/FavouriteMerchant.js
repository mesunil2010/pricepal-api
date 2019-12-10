import legacy_db from '../db/legacy_db'

class FavouriteMerchant {
    constructor(data) {
        if (!data) {
            return
        }

       // this.id             = data.id
        this.user_id        = data.user_id
        this.merchant_id    = data.merchant_id;
        //this.merchant_name  = data.merchant_name;
        this.created_at     = data.created_at;
    }

    async all(request) {
        try {
            return await legacy_db('favourite_merchants')
            .select('*')
                .where({ user_id: request.user_id })
                .orderBy('created_at', request.order)
                .offset(+request.page * +request.limit)
                .limit(+request.limit)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('favourite_merchants').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async find(user_id, merchant_id) {
        try {
            let result = await findById(user_id, merchant_id)
            if (!result) return {}
            this.constructor(result)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
    async delete(request) {
        try {
            return await legacy_db('favourite_merchants')
                .delete()
                .where({ user_id:this.user_id, merchant_id: this.merchant_id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
}
async function findById(user_id, merchant_id) {
    try {
        let [data] = await legacy_db('favourite_merchants')
            .select('*')
            .where({ user_id:user_id, merchant_id: merchant_id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}
export { FavouriteMerchant }