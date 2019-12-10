import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { Ad, findById } from '../models/Ad'
import { Media, findByModelInfo } from '../models/Media';

const adSchema = joi.object({
    id: joi.number().integer(),
    image_name: joi.string().required(),
    end_date: joi.date().required(),
    title: joi.string().allow(''),
    link: joi.string().allow(''),
    impression_count: joi.number().allow(''),
    click_through_count: joi.number().allow(''),
    priority: joi.number().allow(''),
    start_date: joi.date().allow(''),
    status: joi.string().required(),
    is_hot: joi.number().integer(),
    media_id: joi.string().optional()
})

class AdController {

    async index(ctx) {
        const query = ctx.query
        try {
            const ad = new Ad()
            var items = await ad.all(query)
            ctx.body = items
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await ad.count(query))
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

        try {
            if (ids.length > 1) {
                var ads = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Ad({id:ids[i]})
                    await tempc.findModel()
                    ads.push(tempc)
                }
                ctx.body = ads
            } else {
                //Find and show
                const ad = new Ad({id:params.ids})
                await ad.findModel()
                ctx.body = ad
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async create(ctx) {

        const request = ctx.req.fields

        //Attach logged in user
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }

        //Create a new  object using the request params
        const ad = new Ad(request)
        
        //Validate the newly created ad
        const validator = joi.validate(ad, adSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            var [result] = await ad.insert()

            if(ctx.req.files.file){
                var media= new Media({model_type:'Ad',model_id:String(result)});
                let [mid] = await media.insert(ctx.req.files.file)
            }
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }  
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body

        //Make sure they've specified a ad
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find and set that cause
        const ad = new Ad({id:params.id})
        await ad.find()

        if (!ad) ctx.throw(400, 'INVALID_DATA')
        //admin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        //Add the updated date value
        //ad.updated_at  = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
        delete(ad.image_url)
        delete(ad.media)

        //Replace the ad data with the new updated ad data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof ad[parameter] !== "undefined")
                ad[parameter] = request[parameter]
        })
        try {
            await ad.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that ad
        const ad = new Ad({id:params.id})
        await ad.find()
        if (!ad) ctx.throw(400, 'INVALID_DATA')
          //admin only
          const user = new User(ctx.state.user)
          // ToDo: check user is admin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await ad.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }


}

export default AdController
