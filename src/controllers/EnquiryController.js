import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User ,findById as findUserById} from '../models/User'
import { Enquiry, findById } from '../models/Enquiry'
import { Media, findByModelInfo } from '../models/Media';

const enquirySchema = joi.object({
    id: joi.number().integer(),
    serialnum: joi.number().optional(),
    type: joi.string().allow(''),
    orderref: joi.number().integer(),
    transactiondate: joi.string().optional(),
    transactionamount: joi.number().precision(2).allow(''),
    moneybackamount: joi.number().precision(2).allow(''),
    applicable_level: joi.string().allow(''),
    applicable_rebate: joi.number().precision(5).allow(''),
    commission_due: joi.number().precision(5).allow(''),
    additionalinfo: joi.string().allow(''),
    status: joi.string().optional(),
    user_id: joi.number().integer(),
    merchantid: joi.number().integer(),
    version: joi.number().integer(),
    in_freshdesk: joi.number().integer(),
    freshdesk_id: joi.number().integer()
})

class EnquiryController {

    async index(ctx) {
        const query = ctx.query
        try {
            const enquiry = new Enquiry()
            var items = await enquiry.all(query);
            ctx.body = items
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await enquiry.count(query))
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA : Could not get  enquiries')
        }
    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        if (!params.ids) ctx.throw(400, 'INVALID_DATA : Id not passed')

        var ids = [params.ids]

        //check if more than one
        if (params.ids.indexOf(',') > -1) {
            ids = params.ids.split(',')
        }

        //Initialize
        const enquiry = new Enquiry()

        try {
            if (ids.length > 1) {
                var enquiries = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Enquiry()
                    await tempc.findModel(ids[i])
                    enquiries.push(tempc)
                }
                ctx.body = enquiries
            } else {
                //Find and show
                await enquiry.find(params.ids)
                ctx.body = enquiry
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
        const enquiry = new Enquiry(request)
        enquiry.merchantid = enquiry.merchant_id
        delete enquiry.merchant_id

        //Validate the newly created enquiry
        const validator = joi.validate(enquiry, enquirySchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await enquiry.insert()
            if(ctx.req.files.file){
                var media= new Media({model_type:'Enquiry',model_id:String(result)});
                
                if(process.env.NODE_ENV=='production'){
                    //Making media ready for freshdeak before it gets deleted by insert function
                    var fs = require('fs');
                    var mediaStream=fs.createReadStream(ctx.req.files.file.path)
                }

                await media.insert(ctx.req.files.file)
            }
           
            if(process.env.NODE_ENV=='production'){
                try{
                    await this.sendToFreshdesk(result,mediaStream);
                } catch (error) {
                    console.log(error)
                    ctx.throw(400, 'INVALID_DATA')
                }
            }

            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body
        
        //Make sure they've specified a enquiry
        if (!params.id) ctx.throw(400, 'INVALID_DATA')
        //Find and set that cause
        const enquiry = new Enquiry()
        await enquiry.find(params.id)
        enquiry.merchantid = enquiry.merchant_id
        delete enquiry.merchant_id
        
        if (!enquiry) ctx.throw(400, 'INVALID_DATA: ID not found')
        //enquirymin only
        const user = new User(ctx.state.user)

        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }

        //Replace the enquiry data with the new updated enquiry data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof enquiry[parameter] !== "undefined")
            enquiry[parameter] = request[parameter]
        })

        try {
            await enquiry.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that enquiry
        const enquiry = new Enquiry()
        await enquiry.find(params.id)

         //Replace the enquiry data with the new updated enquiry data
         Object.keys(ctx.request.body).forEach(function(parameter, index) {
            enquiry[parameter] = request[parameter]
        })


        if (!enquiry) ctx.throw(400, 'INVALID_DATA')
          //enquirymin only
          const user = new User(ctx.state.user)
          // ToDo: check user is enquirymin
          if(!user.is_admin)
          {
              ctx.throw(403, 'INVALID_AUTHENTICATION')
          }
        try {
            await enquiry.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async sendToFreshdesk(enquiry,media=null){

        if(!enquiry)
            return

        
        var enquiry_id = enquiry[0];
        const enquiryObj = new Enquiry()
        await enquiryObj.find(enquiry_id)

        const user = await findUserById(enquiryObj.user_id)

        const r2 = require('r2');

        var API_KEY=process.env.FRESHDESK_API_KEY;
        var auth = "Basic " + new Buffer(API_KEY + ":" + 'X').toString("base64");
        var url = process.env.FRESHDESK_API_ENDPOINT;
        var headers = {
            'Authorization' : auth
        };

        // if not found then upload
        var FormData = require('form-data');

        var description = `
            ID : ${enquiryObj.id} <br/>
            Type : ${enquiryObj.typr} <br/>
            Merchant ID : ${enquiryObj.merchant_id} <br/>
            Merchant name : ${enquiryObj.merchantname} <br/>
            Trnasaction date : ${enquiryObj.transactiondate} <br/>
            Order ref : ${enquiryObj.orderref} <br/>
            Transaction amount  : ${enquiryObj.transactionamount} <br/>
            Money back amount : ${enquiryObj.moneybackamount} <br/>
            Description : ${enquiryObj.additionalinfo} <br/>
            Status : ${enquiryObj.status} <br/>
            Application rebate : ${enquiryObj.applicable_rebate} <br/>
        `; 
        console.log(user.email);
        var formData = new FormData();
        formData.append('email', user.email)
        formData.append('subject', 'Enquiry from the pricepal website')
        formData.append('description', description)
        formData.append('type', 'Problem')
        formData.append('priority', '1')
        formData.append('requester_id', '1')
        formData.append('status', '2')
        if(media!=null)
            formData.append('attachments[]', media);


        try{ 
            var response = await r2.post( url+'/api/v2/tickets',{headers, body: formData}).json;
            if(response.id){
                const enquiryObj = new Enquiry()
                await enquiryObj.find(enquiry_id)
                enquiryObj.freshdesk_id=response.id
                await enquiryObj.update()
            }
 
        }catch(error)
        {
            console.log(error);
        }
    }
}

export default EnquiryController
