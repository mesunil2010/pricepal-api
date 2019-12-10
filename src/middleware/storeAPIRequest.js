
import { User } from '../models/User';
import { APIRequestEvent } from '../models/APIRequestEvent';

module.exports = (opts = {}) => {

    const secret = opts.secret

    const middleware = async function storeAPIRequest(ctx, next) {
       
       var user = new User(ctx.state.user);

       var ip_address = ctx.request.ip
       if (ctx.request.headers['x-forwarded-for']) {
           ip_address = ctx.request.headers['x-forwarded-for']
       }

       try{
        var path = ctx.originalUrl.split("/");
        let api_method = path[4] || "";
            var ping = new APIRequestEvent({user_id: user.id, api_method: api_method, ip_address: ip_address});
            await ping.insert();
       }catch(error)
       {

       }
        return next()
    }


    return middleware
}
