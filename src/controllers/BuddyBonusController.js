import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { BuddyBonus } from '../models/BuddyBonus'

const bonusSchema = joi.object({
    id: joi.number().integer(),
    user_id: joi.number().integer().required(),
    type: joi.string().required(),
    transaction_id: joi.number().integer().required(),
    amount: joi.number().allow(''),
    status: joi.string().required(),
    date: joi.date().required()
})

class BuddyBonusController {

    async index(ctx) {
        const query = ctx.query
        try {
            const bonus = new BuddyBonus()
            var items = await bonus.all(query)
            ctx.body = items
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await bonus.count(query))
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
        const bonus = new BuddyBonus()

        try {
            if (ids.length > 1) {
                var bonuses = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new BuddyBonus()
                    await tempc.find(ids[i])
                    bonuses.push(tempc)
                }
                ctx.body = bonuses
            } else {
                //Find and show
                await bonus.find(params.ids)
                ctx.body = bonus
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
        const bonus = new BuddyBonus(request)

        //Validate the newly created bonus
        const validator = joi.validate(bonus, bonusSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await bonus.insert()
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body

        //Make sure they've specified a bonus
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find and set that cause
        const bonus = new BuddyBonus()
        await bonus.find(params.id)

        if (!bonus) ctx.throw(400, 'INVALID_DATA')
        //bonusmin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        //Replace the bonus data with the new updated bonus data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof bonus[parameter] !== "undefined")
            bonus[parameter] = request[parameter]
        })

        try {
            await bonus.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that bonus
        const bonus = new BuddyBonus()
        await bonus.find(params.id)
        if (!bonus) ctx.throw(400, 'INVALID_DATA')
          //bonusmin only
          const user = new User(ctx.state.user)
          // ToDo: check user is bonusmin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await bonus.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
}

export default BuddyBonusController
