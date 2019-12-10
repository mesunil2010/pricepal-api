

import sha256 from 'crypto-js/sha256';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';

import { User, findByAPIKey } from '../models/User'

module.exports = (opts = {}) => {
    const secret = opts.secret

    const middleware = async function legacyHmacValidation(ctx, next) {
       
        var params      = ctx.params;

        var path = ctx.originalUrl.split("/");
        /*
        [ '',
  'api',
  '200003076',
  '1526382834',
  'settings',
  '5e7d7732221173eb19084452fe647563147d7396917192b1e57547f870583efa' ]
  */
        var user_id     = params.user_id;
        var timestamp   = params.timestamp;
        var client_hmac  = params.hmac_check;

        // verbs should be the timestamp, and pathing e.g. timestamp settings 
        var verbs = [timestamp]
        if(path.length>5)
        {
            for(var v=4;v<path.length-1;v++)
            {
                verbs.push(path[v]);
            }
        }        

        var verbs_str = "";
        //output as single string without commas
        for(var i=0;i<verbs.length;i++)
        {
            verbs_str+=String(verbs[i]);
        }

        const user = new User();
        try{
            await user.find(user_id);
        }catch(e)
        {
            ctx.throw(401, 'AUTHENTICATION_ERROR  - no data matching :'+user_id+" "+verbs_str)
        }

        // temporarily ignore api_secret 

        ctx.state.user = user;
        return next()

        /*

        if(!user.api_secret){
            ctx.throw(401, 'AUTHENTICATION_ERROR  - no key matching :'+user_id+" "+verbs_str)
        }

        var server_hmac = hmacSHA256(verbs_str, user.api_secret).toString()

        // console.log("legacyHmac",server_hmac,client_hmac,verbs_str,path.length)

        if(client_hmac == server_hmac)
        {
            ctx.state.user = user;
        }else{
            ctx.throw(401, 'AUTHENTICATION_ERROR');
        }

        return next()*/
    }


    return middleware
}
