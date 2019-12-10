import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { Voucher, findById } from '../models/Voucher'

const voucherSchema = joi.object({
    id: joi.number().integer(),
    title: joi.string().required(),
    code: joi.string().allow(''),
    description: joi.string().allow(''),
    conditions: joi.string().allow(''),
    min_user_level: joi.string().allow(''),
    start_date: joi.date().required(),
    end_date: joi.date().required(),
    merchant_id: joi.number().integer(),
    status: joi.string().required(),
    is_deleted: joi.number().integer()
})

class VoucherController {

    async index(ctx) {
        const query = ctx.query
        try {
            const voucher = new Voucher()
            var items = await voucher.all(query);
            ctx.body = items
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            if(query.filter)
                query.filter+='|is_deleted:0'
            else 
                query.filter='is_deleted:0'
            ctx.set('Pagination-Count', await voucher.count(query))
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
        const voucher = new Voucher()

        try {
            if (ids.length > 1) {
                var vouchers = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Voucher()
                    await tempc.findModel(ids[i])
                    vouchers.push(tempc)
                }
                ctx.body = vouchers
            } else {
                //Find and show
                await voucher.findModel(params.ids)
                ctx.body = voucher
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
        const voucher = new Voucher(request)

        //Validate the newly created voucher
        const validator = joi.validate(voucher, voucherSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await voucher.insert()
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body
        
        //Make sure they've specified a voucher
        if (!params.id) ctx.throw(400, 'INVALID_DATA')
        //Find and set that cause
        const voucher = new Voucher()
        await voucher.find(params.id)
        
        if (!voucher) ctx.throw(400, 'INVALID_DATA')
        //vouchermin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        //Voucherd the updated date value
        //voucher.updated_at  = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
        delete(voucher.image_url)

        //Replace the voucher data with the new updated voucher data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof voucher[parameter] !== "undefined")
            voucher[parameter] = request[parameter]
        })

        try {
            await voucher.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that voucher
        const voucher = new Voucher()
        await voucher.find(params.id)

         //Replace the voucher data with the new updated voucher data
         Object.keys(ctx.request.body).forEach(function(parameter, index) {
            voucher[parameter] = request[parameter]
        })


        if (!voucher) ctx.throw(400, 'INVALID_DATA')
          //vouchermin only
          const user = new User(ctx.state.user)
          // ToDo: check user is vouchermin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await voucher.softDelete(user)
            await voucher.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
}

export default VoucherController
