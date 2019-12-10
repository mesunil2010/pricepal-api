import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { TempCommission } from '../models/TempCommission'
import { getUserValue,getUserShare } from '../common/Util';

const tempCommissionSchema = joi.object({
    id: joi.number().integer(),
    moneyvaluef: joi.number().precision(2).allow(''),
    percentagevaluef: joi.number().precision(2).allow(''),
    merchant_id: joi.number().integer().required(),
    start_date: joi.date().required(),
    end_date: joi.date().required(),
    is_deleted: joi.number().integer()
})

class TempCommissionController {

    async index(ctx) {
        const query = ctx.query
        const user = new User(ctx.state.user)
        try {
            const tempCommission = new TempCommission()
            var items = await tempCommission.all(query)
            ctx.body = items
            for(var i=0;i<items.length;i++)
            {
                items[i].formatted_commission = await getUserValue(items[i],user.id);
                delete items[i].moneyvaluef;
                delete items[i].percentagevaluef;
            }
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await tempCommission.count(query))
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        const user = new User(ctx.state.user)
        if (!params.ids) ctx.throw(400, 'INVALID_DATA')

        var ids = [params.ids]

        //check if more than one
        if (params.ids.indexOf(',') > -1) {
            ids = params.ids.split(',')
        }

        //Initialize
        const tempCommission = new TempCommission()

        try {
            if (ids.length > 1) {
                var tempCommissiones = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new TempCommission()
                    await tempc.findModel(ids[i])
                    if(user.id && tempc.id  )
                    {
                        try{
                            let m_url = tempc.url
                            if(m_url)tempc.network_url = await getMerchantActivateLink(m_url,user.id ) 
                            tempc.formatted_commission = await getUserValue(tempc,user.id);
                        }catch(e){console.log(e)}
                    }
                    else if(tempc.id)
                    {
                        try{
                            var user_id=query.user_id?query.user_id:null;
                            tempc.formatted_commission = await getUserValue(tempc,user_id);
                        }catch(e){console.log(e)}
                    }
                    delete tempc.moneyvaluef;
                    delete tempc.percentagevaluef;

                    tempCommissiones.push(tempc)
                }
                ctx.body = tempCommissiones
            } else {
                //Find and show
                await tempCommission.find(params.ids)
                ctx.body = tempCommission
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
        const tempCommission = new TempCommission(request)

        //Validate the newly created tempCommission
        const validator = joi.validate(tempCommission, tempCommissionSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await tempCommission.insert()
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body

        //Make sure they've specified a tempCommission
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find and set that cause
        const tempCommission = new TempCommission()
        await tempCommission.find(params.id)

        if (!tempCommission) ctx.throw(400, 'INVALID_DATA')
        //tempCommissionmin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        //Replace the tempCommission data with the new updated tempCommission data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof tempCommission[parameter] !== "undefined")
            tempCommission[parameter] = request[parameter]
        })

        try {
            await tempCommission.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that tempCommission
        const tempCommission = new TempCommission()
        await tempCommission.find(params.id)
        if (!tempCommission) ctx.throw(400, 'INVALID_DATA')
          //tempCommissionmin only
          const user = new User(ctx.state.user)
          // ToDo: check user is tempCommissionmin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await tempCommission.softDelete(user)
            await tempCommission.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }
}

export default TempCommissionController
