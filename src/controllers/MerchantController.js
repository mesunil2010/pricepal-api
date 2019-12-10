import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User, findById as findUserById } from '../models/User'
import { Merchant, findById as findMerchantById, Product, findProductsById, findProductsByMerchantId,getAllCategories} from '../models/Merchant'
import { Media, findByModelInfo } from '../models/Media';
import { findActiveByMerchantId as findTempCommission} from '../models/TempCommission';
import { getUserValue,getUserShare } from '../common/Util';
import globalConst from '../common/Constant'

const merchantSchema = joi.object({
    id: joi.number().integer(),
    name: joi.string().required(),
    displayname: joi.string().required(),
    websiteurl: joi.string().optional().allow(''),
    url: joi.string().optional().allow(''),
    description: joi.string().optional().allow(''),
    status: joi.string().required(),
    created_at: joi.date().optional(),
    aggregator_id: joi.number().integer().optional(),
    logo_url: joi.string().optional(),
    sprite_url: joi.string().optional(),
    folo_url: joi.string().optional(),
    user_id: joi.number().integer().allow(''),
    website_url: joi.string().allow(''),
    moneyvaluef: joi.number().precision(2).allow(''),
    percentagevaluef: joi.number().precision(2).allow(''),
    fixedpercentagevaluef: joi.number().precision(2).allow(''),
    fixedmoneyvaluef: joi.number().precision(2).allow('')
})

const productSchema = joi.object({
    id: joi.number().integer(),
    name: joi.string().required(),
    details: joi.string().optional(),
    percentagevaluef: joi.number().precision(2).allow(''),
    moneyvaluef: joi.number().precision(2).allow(''),
    merchant_id: joi.number().required(),
    created_at: joi.date().optional(),
    updated_at: joi.date().optional(),
})

class MerchantController {

    async index(ctx) {
        const query = ctx.query
        const user = new User(ctx.state.user)

        try {
            const merchant = new Merchant()
            var items = await merchant.all(query);
            for(var i=0;i<items.length;i++)
            {
                items[i].formatted_commission = await getUserValue(items[i],user.id);
                items[i].temp_commission = await findTempCommission(items[i].id,user.id);
                delete items[i].moneyvaluef;
                delete items[i].percentagevaluef;
                delete items[i].fixedpercentagevaluef;
                delete items[i].fixedmoneyvaluef;
            }
            ctx.body = items;
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await merchant.count(query));
             
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        const user = new User(ctx.state.user)

        if (!params.merchant_ids) ctx.throw(400, 'INVALID_DATA')

        var ids = [params.merchant_ids]
        //check if more than one
        if (params.merchant_ids.indexOf(',') > -1) {
            ids = params.merchant_ids.split(',')
        }

        //Initialize
        const merchant = new Merchant()

        try {
            if (ids.length > 1) {
                var merchants = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Merchant()
                    await tempc.findModel(ids[i])

                    if(user.id)
                    {
                        try{
                            let m_url = tempc.url
                            if(m_url)tempc.network_url = await getMerchantActivateLink(m_url,user.id ) 
                            tempc.formatted_commission = await getUserValue(tempc,user.id);
                            tempc.temp_commission = await findTempCommission(tempc.id,user.id);
                        }catch(e){console.log(e)}
                    }
                    else if(tempc.id)
                    {
                        try{
                            var user_id=query.user_id?query.user_id:null;
                            tempc.formatted_commission = await getUserValue(tempc,user_id);
                            tempc.temp_commission = await findTempCommission(tempc.id,user_id);
                        }catch(e){console.log(e)}
                    }
                    
                    delete tempc.url;
                    delete tempc.moneyvaluef;
                    delete tempc.percentagevaluef;
                    delete tempc.fixedpercentagevaluef;
                    delete tempc.fixedmoneyvaluef;
                    merchants.push(tempc)
                }

                ctx.body = merchants
            } else {
                //Find and show
                await merchant.findModel(params.merchant_ids)
                
                if(user.id)
                {
                    try{
                        let m_url =  merchant.url
                        if(m_url)merchant.network_url = await getMerchantActivateLink(m_url,user.id ) 
                        merchant.formatted_commission = await getUserValue(merchant,user.id);
                        merchant.temp_commission = await findTempCommission(merchant.id,user.id);
                    }catch(e){console.log(e)}
                }
                else if(merchant.id) 
                {
                    try{
                        var user_id=query.user_id?query.user_id:null;
                        merchant.formatted_commission = await getUserValue(merchant,user_id);
                        merchant.temp_commission = await findTempCommission(merchant.id,user_id);
                    }catch(e){console.log(e)}
                }
               
                delete merchant.moneyvaluef;
                delete merchant.percentagevaluef;
                delete merchant.fixedpercentagevaluef;
                delete merchant.fixedmoneyvaluef;
                delete merchant.url;
                ctx.body = merchant
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
        const merchant = new Merchant(request)
       
        //Validate the newly created merchant
        const validator = joi.validate(merchant, merchantSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        merchant.websiteurl=merchant.website_url
        merchant.joindate=merchant.created_at

        delete merchant.aggregator_id
        delete merchant.created_at
        delete merchant.website_url

        try {
            let result = await merchant.insert()
            if(ctx.req.files.file){
                var media= new Media({model_type:'Merchant',model_id:String(result)});
                let [mid] = await media.insert(ctx.req.files.file)
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

        //Make sure they've specified a merchant
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find and set that cause
        const merchant = new Merchant()
        await merchant.find(params.id)
        if (!merchant) ctx.throw(400, 'INVALID_DATA')
        //admin only
        const user = new User(ctx.state.user)

        // ToDo: check user is admin
        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }

        //Add the updated date value
        merchant.updated_at  = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
        merchant.joindate = merchant.created_at
       

        //Replace the merchant data with the new updated merchant data
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            if (typeof merchant[parameter] !== "undefined" || merchant[parameter] !== null)
            merchant[parameter] = request[parameter]
        })

        delete merchant.clicks
        delete merchant.aggregator_id
        delete merchant.created_at
        delete merchant.user_id
        delete merchant.website_url
        delete merchant.media

        try {
            await merchant.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async delete(ctx) {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA')

        //Find that merchant
        const merchant = new Merchant()
        await merchant.find(params.id)
        if (!merchant) ctx.throw(400, 'INVALID_DATA')
        //admin only
        const user = new User(ctx.state.user)
        // ToDo: check user is admin
        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        try {
            await merchant.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

        
    async getCategories(ctx)
    {
        try {
            var categories=await getAllCategories()
            ctx.body=categories

        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

    }

    async getProducts(ctx)
    {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA : ID not provided')

        var userShare=0
        if(ctx.state.user)
            var authenticatedUser = await findUserById(ctx.state.user.id)

        try {
            var products=await findProductsByMerchantId(params.id)

            if(!authenticatedUser){

                for (var i = 0; i < products.length; i++) {
                    var percentagec = {}
                    var valuec = {}
                    products[i].percentage_rate=null;
                    products[i].moneyvalue_rate=null;

                    if(products[i].percentagevaluef) {
                        percentagec.USER_1=(globalConst.USER_1_REV_SHARE_VALUE*products[i].percentagevaluef).toFixed(2)+"%";
                        percentagec.USER_2=(globalConst.USER_2_REV_SHARE_VALUE*products[i].percentagevaluef).toFixed(2)+"%";
                        percentagec.USER_3=(globalConst.USER_3_REV_SHARE_VALUE*products[i].percentagevaluef).toFixed(2)+"%";
                        percentagec.USER_4=(globalConst.USER_4_REV_SHARE_VALUE*products[i].percentagevaluef).toFixed(2)+"%";
                        products[i].percentagec=percentagec
                    }
                    
                    if(products[i].moneyvaluef) {
                        var currencyFormatter = require('currency-formatter');              
                        valuec.USER_1=currencyFormatter.format((globalConst.USER_1_REV_SHARE_VALUE * products[i].moneyvaluef).toFixed(2), { code: 'AUD' });
                        valuec.USER_2=currencyFormatter.format((globalConst.USER_2_REV_SHARE_VALUE * products[i].moneyvaluef).toFixed(2), { code: 'AUD' });
                        valuec.USER_3=currencyFormatter.format((globalConst.USER_3_REV_SHARE_VALUE * products[i].moneyvaluef).toFixed(2), { code: 'AUD' });
                        valuec.USER_4=currencyFormatter.format((globalConst.USER_4_REV_SHARE_VALUE * products[i].moneyvaluef).toFixed(2), { code: 'AUD' });
                        products[i].moneyvalue_rate=valuec
                    }

                    delete products[i].percentagevaluef
                    delete products[i].moneyvaluef
                   

                }

            } else {
                userShare=getUserShare(authenticatedUser);
                for (var i = 0; i < products.length; i++) {
                    var percentagec = {}
                    var valuec = {}
                    products[i].percentage_rate=null;
                    products[i].moneyvalue_rate=null;

                    if(products[i].percentagevaluef) {
                        percentagec[authenticatedUser.level]=(userShare*products[i].percentagevaluef).toFixed(2)+"%";  
                        products[i].percentage_rate=percentagec
                        
                    }

                    if(products[i].moneyvaluef) {
                        var currencyFormatter = require('currency-formatter');         
                        valuec[authenticatedUser.level]=currencyFormatter.format((userShare * products[i].moneyvaluef).toFixed(2), { code: 'AUD' });
                        products[i].moneyvalue_rate=valuec
                        
                    }
                    delete products[i].percentagevaluef
                    delete products[i].moneyvaluef
                }
                
            }
            ctx.body=products

        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA : Get action failed')
        }

    }

    async showProducts(ctx)
    {
        const params = ctx.params
        if (!params.id) ctx.throw(400, 'INVALID_DATA : ID not provided')

        var userShare=0
        if(ctx.state.user)
            var authenticatedUser = await findUserById(ctx.state.user.id)

        try {
            var product=await findProductsById(params.product_id)
            if(product) {
                if(!authenticatedUser){
                    var tempc = {}
                    tempc.USER_1=(globalConst.USER_1_REV_SHARE_VALUE*product.percentagevaluef).toFixed(2)+"%";
                    tempc.USER_2=(globalConst.USER_2_REV_SHARE_VALUE*product.percentagevaluef).toFixed(2)+"%";
                    tempc.USER_3=(globalConst.USER_3_REV_SHARE_VALUE*product.percentagevaluef).toFixed(2)+"%";
                    tempc.USER_4=(globalConst.USER_4_REV_SHARE_VALUE*product.percentagevaluef).toFixed(2)+"%";
                    product.rate=tempc
                    delete product.percentagevaluef
                } else {
                    userShare=getUserShare(authenticatedUser);    
                    var tempc = {}
                    tempc[authenticatedUser.level]=(userShare*product.percentagevaluef).toFixed(2)+"%";  
                    product.rate=tempc
                    delete product.percentagevaluef    
                }

                ctx.body=product
            } else {
                ctx.throw(400, 'INVALID_DATA : Product not found')
            }

        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA : Show action failed')
        }

    }

    async createProducts(ctx)
    {
        const params  = ctx.params
        const request = ctx.request.body

        if (!params.id) ctx.throw(400, 'INVALID_DATA : ID not provided')
      
        const user = new User(ctx.state.user)
        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }

        var product = new Product(request);
        product.merchant_id=params.id;

        const validator = joi.validate(product, productSchema)
        if (validator.error) ctx.throw(400, validator.error.details[0].message)

        try {
            let result = await product.insert()
            ctx.body = { message: 'SUCCESS', id: result }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA : Create action failed' )
        }
       

    }

    async updateProducts(ctx)
    {
        const params = ctx.params
        const request = ctx.request.body

        if (!params.id) ctx.throw(400, 'INVALID_DATA : ID not provided')

        const user = new User(ctx.state.user)
        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        const product = new Product()
        await product.find(params.product_id)
        if (!product) ctx.throw(400, 'INVALID_DATA : Product not found for given ID')
        
 
         //Replace the merchant data with the new updated merchant data
         Object.keys(ctx.request.body).forEach(function(parameter, index) {
             if (typeof product[parameter] !== "undefined" || product[parameter] !== null)
             product[parameter] = request[parameter]
         })

        try {

            await product.update()
            ctx.body = { message: 'SUCCESS' }

            
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA : Update action failed' )
        }

    }

    async deleteProducts(ctx)
    {
        const params = ctx.params
        const request = ctx.request.body
        
        if (!params.id) ctx.throw(400, 'INVALID_DATA : ID not provided')

        const user = new User(ctx.state.user)
        if(!user.is_admin)
        {
            ctx.throw(403, 'INVALID_AUTHENTICATION')
        }
        
        const product = new Product()
        await product.find(params.product_id)
        if (!product) ctx.throw(400, 'INVALID_DATA : Product not found for given ID')

        try {
            await product.destroy()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA : Delete action failed' )
        }

    }

}

async function getMerchantActivateLink(merchant_network_url, user_id)
{
    var  placeholder = "__MBC_TRACKING_INFO_HERE__"
    let sid = await "User_"+user_id;//this.getUserSubID(user);

    return merchant_network_url.replace(placeholder,sid);
    
}

export default MerchantController
