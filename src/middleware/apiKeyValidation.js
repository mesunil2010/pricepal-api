

import { User, findByAPIKey } from '../models/User'

module.exports = (opts = {}) => {
    const secret = opts.secret

    const middleware = async function apiKeyValidation(ctx, next) {
        //If there's no secret set, toss it out right away
        //if (!secret) ctx.throw(401, 'INVALID_SECRET')

        //Grab the token
        const api_key = getAPIKey(ctx)
        if(!api_key)ctx.throw(401, 'AUTHENTICATION_ERROR  - no valid x-api-key in header')

        try {
            //Try and decode the token asynchronously
            const userData = await findByAPIKey(api_key);
            //If it worked set the ctx.state.user parameter to the decoded token.
            ctx.state.user = userData;
            if(!userData.id)ctx.throw(401, 'AUTHENTICATION_ERROR  - no valid x-api-key in header')
        } catch (error) {
            //If it's an expiration error, let's report that specifically.
            
                ctx.throw(401, 'AUTHENTICATION_ERROR  - no valid x-api-key in header')
            
        }

        return next()
    }

    function getAPIKey(ctx) {
        if (!ctx.header || !ctx.header['x-api-key']) {
            return ctx.throw(401, 'AUTHENTICATION_ERROR - no x-api-key in header')
        }

        return ctx.header['x-api-key']
    }

    return middleware
}
