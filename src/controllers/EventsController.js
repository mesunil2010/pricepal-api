import joi from 'joi'
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import { Merchant } from '../models/Merchant';
import { Click } from '../models/Click';
import logger from '../logger/log'

const clickSchema = joi.object({
    id:joi.any(),
    user_id: joi.number().required(),
    model_id: joi.number().required(),
    model_type: joi.string().required(),
    ipaddress: joi.any(),
    source: joi.any(),
    app_type: joi.any(),
    app_version: joi.any(),
    platform_type: joi.any(),
    platform_version: joi.any(),
    version:joi.any(),
    clicktimestamp: joi.any()
})
/**
 * Must be non blocking, no matter the client, so only return 200 status code, but with message of SUCCESS/ERROR.
 * 
 */
class EventController {
    async create(ctx) {
        const query = ctx.query
        const body =ctx.request.body;

        try{

        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async createClickthrough(ctx)
    {
       
        //var query = ctx.query;
        var params = ctx.request.body
        var model_type = params.model_type       
        var model_id = params.model_id
        var user_id = params.user_id
       
        var ip_address = ctx.request.ip
        if (ctx.request.headers['x-forwarded-for']) {
            ip_address = ctx.request.headers['x-forwarded-for']
        }

        //console.log(merchant_id, user_id)
        if(!model_id  || !model_type || !user_id)
        {
            ctx.throw(400, 'INVALID_DATA')
            //ctx.body = { message: 'ERROR' }
        }

        //database vars
        var db_name = model_type.toLowerCase()+'s'
        var table_name = model_type=='Merchant'?'clickthrucount':'click_through_count'
         
        try{
            let increment =  await legacy_db(db_name)
            .increment(table_name)
            .where({ id: model_id})

        }catch(error)
        {
            logger.error(error)
            //ctx.throw(400, 'INVALID_DATA')
            ctx.body = { message: 'ERROR' }
        }
        
        try{
            var click = new Click({
                user_id: user_id,
                model_type: model_type,
                model_id: model_id,
                ipaddress: ip_address,
                source: ctx.headers.referer,
                app_type: 'PRICEPAL-Redirector',
                app_version: 2,
                platform_type: 'folo',
                platform_version: 2,
                version:2
            })

            const validator = joi.validate(click, clickSchema)
            if (validator.error) ctx.throw(400, validator.error.details[0].message)

            //backward comptatibility 
            if(model_type=='Merchant')
                click[click.model_type+'id'] = click.model_id;

            await click.insert();
        }catch(error)
        {
            logger.error(error)
           // ctx.throw(400, 'INVALID_DATA')
            ctx.body = { message: 'ERROR' }
        }

        ctx.body = { message: 'SUCCESS' }
    
    }
}

export default EventController
