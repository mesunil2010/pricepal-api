import legacy_db from '../db/legacy_db'

class MerchantCategory {
    constructor(data) {
        if (!data) {
            return
        }

        this.id         = data.id
        this.category   = data.category
        this.parent     = data.parent;
        this.parent_id  = data.parent_id;
        this.categories = [];
    }

    async all(request) {
        try {
            return await legacy_db('categories').select('*')
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


export { MerchantCategory }
