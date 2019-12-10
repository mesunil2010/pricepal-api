import joi from 'joi'
import { User } from '../models/User'
import { Merchant } from '../models/Merchant'
import { FavouriteMerchant } from '../models/FavouriteMerchant'
/**
 * Created as separate controller due to its need purely for its expedited need for the legacy browser extension - api/v1 addition (addition to legacy php symfony)
 * 
 * Once complete and spec'd for the api/v2, integrate into relevant controller
 * 
 */
const favouriteSchema = joi.object({
    user_id: joi.number().integer(),
    merchant_id: joi.number().required(),
    merchant_name: joi.string().optional()
})

class FavouriteMerchantController {
    async index(ctx) {
        const query = ctx.query

        //Attach logged in user
        const autenticatedUser = new User(ctx.state.user)

        //For Pricepal - legacy has the favourites on the user table, this can't be changed until the legacy app is sunset.

        //for now use the users.favourites column as canonical, whilst also performing creation/update/deleting of items in favourite_merchants table in new FOLO DB


        const data = new FavouriteMerchant();
        query.user_id = autenticatedUser.id;
        query.order = 'DESC'
        query.page = 0
        query.limit = 10
        //Let's check that the sort options were set. Sort can be empty
        if (!query.order || !query.limit) {
            ctx.throw(400, 'INVALID_ROUTE_OPTIONS')
        }
        let result = {}
        //Get paginated list
        try {
           // if (!query.autenticatedUser.id) {
                let favourites  = await data.all(query);

                for(var i=0;i<favourites.length;i++)
                {
                    delete favourites[i].id;
                    delete favourites[i].user_id;
                }
                //filter so list only has merchant_ids
                ctx.body = favourites
         //   }
        } catch (error) {
            console.log('Error','FavouriteMerchantController:',error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    
    async create(ctx) {
        const request = ctx.request.body


        //Attach logged in user
        const user = new User(ctx.state.user)
        request.user_id = user.id
        //accept store_id as alias for merchant_id for backwards compatability
        /*if(request.store_id)
        {
            request.merchant_id = request.store_id;
            delete request.store_id;
        }*/
        //data.user_id = user.id;

        //Create a new  object using the request params
        const data = new FavouriteMerchant(request)

        //Validate the newly created 
        const validator = joi.validate(request, favouriteSchema)
        if (validator.error)
        {
            ctx.throw(400, validator.error.details[0].message)
        } 


        //check if exists

        try {
            let result = await data.insert()
            //data.id = result[0];
            ctx.body = data;//{ message: 'SUCCESS', id: result[0] }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    } 


    async delete(ctx) {
        const params = ctx.params
        const query = ctx.query
        if (!params.merchant_id) ctx.throw(400, 'INVALID_DATA')

        //Grab the user //If it's not their favourite - error out
        const user = new User(ctx.state.user)
        query.user_id = user.id

        //Find that favourite
        const data = new FavouriteMerchant()
        await data.find(query.user_id, params.merchant_id)
        if (!data) ctx.throw(400, 'INVALID_DATA')

        //if (data.user_id !== user.id) ctx.throw(400, 'INVALID_DATA')

        try {
            await data.delete()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
}

export default FavouriteMerchantController