import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { Offer, findById } from '../models/Offer'

const offerSchema = joi.object({
    id: joi.number().integer(),
    title: joi.string().required(),
    type: joi.string().allow(''),
    preface: joi.string().allow(''),
    postscript: joi.string().allow(''),
    coupon: joi.string().allow(''),
    added_date: joi.date().required(),
    valid_from_date: joi.date().required(),
    expire_date: joi.date().required(),
    merchant_id: joi.number().integer(),
    status: joi.string().required()
})

class OfferController {

    async index(ctx) {
        const query = ctx.query
        try {
            const offer = new Offer()
            var items = await offer.all(query)
            ctx.body = items
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await offer.count(query))
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        if (!params.ids) ctx.throw(400, 'INVALID_DATA')

        var ids = [params.ids]

        //check if more than one
        if (params.ids.indexOf(',') > -1) {
            ids = params.ids.split(',')
        }

        //Initialize
        const offer = new Offer()

        try {
            if (ids.length > 1) {
                var offers = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Offer()
                    await tempc.find(ids[i])
                    offers.push(tempc)
                }
                ctx.body = offers
            } else {
                //Find and show
                await offer.find(params.ids)
                ctx.body = offer
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async create(ctx) {
        const request = ctx.request.body

        //Attach logged in user
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }

        //Create a new  object using the request params
        const offer = new Offer(request)

        //Validate the newly created offer
        const validator = joi.validate(offer, offerSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await offer.insert()
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body

        //Make sure they've specified a offer
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find and set that cause
        const offer = new Offer()
        await offer.find(params.id)

        if (!offer) ctx.throw(400, 'INVALID_DATA')
        //offermin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        //Offerd the updated date value
        //offer.updated_at  = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
        delete(offer.image_url)

        //Replace the offer data with the new updated offer data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof offer[parameter] !== "undefined")
            offer[parameter] = request[parameter]
        })

        try {
            await offer.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that offer
        const offer = new Offer()
        await offer.find(params.id)
        if (!offer) ctx.throw(400, 'INVALID_DATA')
          //offermin only
          const user = new User(ctx.state.user)
          // ToDo: check user is offermin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await offer.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
}

export default OfferController
