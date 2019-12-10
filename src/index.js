'use strict'

import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'kcors'
import logger from './logger/log'
import userAgent from 'koa-useragent'
import error from 'koa-json-error'
import ratelimit from 'koa-ratelimit'
import redis from 'ioredis'

//Routes
import userActionsRouter from './routes/userActions'
import usersRouter from './routes/users'
import transactionsRouter from './routes/transactions'
import paymentsRouter from './routes/payments'
import webhooksRouter from './routes/webhooks'
import legacyRouter from './routes/legacy'
import merchantsRouter from './routes/merchants'
import eventsRouter from './routes/events'
import adsRouter from './routes/ads'
import offersRouter from './routes/offers'
import vouchersRouter from './routes/vouchers'
import clicksRouter from './routes/clicks'
import enquiriesRouter from './routes/enquiries'
import bonusesRouter from './routes/bonuses'
import batchesRouter from './routes/batches'
import tempCommissionRouter from './routes/tempCommissions'

//Initialize app
const app = new Koa()

console.log('Running index v 0.2.28')

//Here's the rate limiter
/*app.use(
    ratelimit({
        db: new redis(),
        duration: 60000,
        errorMessage:
            "Too much action buddy, go easy, if you need a higher rate limit give us an email.",
        id: ctx => ctx.ip,
        headers: {
            remaining: 'Rate-Limit-Remaining',
            reset: 'Rate-Limit-Reset',
            total: 'Rate-Limit-Total',
        },
        max: 100,
    })
)*/
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });

//Let's log each successful interaction. We'll also log each error - but not here,
//that's be done in the json error-handling middleware
app.use(async (ctx, next) => {
    try {
        await next()
        logger.info(
            ctx.method + ' ' + ctx.url + ' RESPONSE: ' + ctx.response.status
        )
    } catch (error) {}
})

//Apply error json handling
let errorOptions = {
    postFormat: (e, obj) => {
        //Here's where we'll stick our error logger.
        logger.info(obj)
        if (process.env.NODE_ENV !== 'production') {
            return obj
        } else {
            delete obj.stack
            delete obj.name
            return obj
        }
    },
}
app.use(error(errorOptions))

// return response time in X-Response-Time header
app.use(async function responseTime(ctx, next) {
    const t1 = Date.now()
    await next()
    const t2 = Date.now()
    ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms')
})

//For cors with options
app.use(cors({ origin: '*' }))

//For useragent detection
app.use(userAgent)

//For managing body. We're only allowing json.
app.use(bodyParser({ enableTypes: ['json'] }))

//For router
app.use(userActionsRouter.routes())
app.use(userActionsRouter.allowedMethods())
app.use(usersRouter.routes())
app.use(usersRouter.allowedMethods())

app.use(transactionsRouter.routes())
app.use(transactionsRouter.allowedMethods())

app.use(paymentsRouter.routes())
app.use(paymentsRouter.allowedMethods())

app.use(webhooksRouter.routes())
app.use(webhooksRouter.allowedMethods())

app.use(merchantsRouter.routes())
app.use(merchantsRouter.allowedMethods())

app.use(eventsRouter.routes())
app.use(eventsRouter.allowedMethods())

app.use(adsRouter.routes())
app.use(adsRouter.allowedMethods())

app.use(offersRouter.routes())
app.use(offersRouter.allowedMethods())

app.use(vouchersRouter.routes())
app.use(vouchersRouter.allowedMethods())

app.use(enquiriesRouter.routes())
app.use(enquiriesRouter.allowedMethods())

app.use(bonusesRouter.routes())
app.use(bonusesRouter.allowedMethods())

app.use(tempCommissionRouter.routes())
app.use(tempCommissionRouter.allowedMethods())

app.use(clicksRouter.routes())
app.use(clicksRouter.allowedMethods())

app.use(batchesRouter.routes())
app.use(batchesRouter.allowedMethods())

//These must be always at end to work properly
app.use(legacyRouter.routes())
app.use(legacyRouter.allowedMethods())

export default app
