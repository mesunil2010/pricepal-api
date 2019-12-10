import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import TransactionController from '../controllers/TransactionController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new TransactionController()

router.post(
    '/api/v2/webhooks/pricepal/aggregator/transactions',
    async (ctx, next) => {
        //validate is a call from aggregator, or bounce
        //if(ctx.params.api_key!=)ctx.throw(400, 'INVALID_DATA' + error)

        //update if network / nework_transaction_id combination exists
        //else insert
        await controller.upsertFromAggregator(ctx)
    }
)

export default router
