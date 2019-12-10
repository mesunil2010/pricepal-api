import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import TransactionController from '../controllers/TransactionController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new TransactionController()

router.get('/api/v2/transactions', jwtMiddleware,async (ctx, next) => {
    await controller.index(ctx)
})
router.post('/api/v2/transactions', jwtMiddleware,async (ctx, next) => {
    await controller.create(ctx)
})

router.get('/api/v2/transactions/totals', jwtMiddleware, async (ctx, next) => {
    await controller.total(ctx)
})

router.get('/api/v2/transactions/:transaction_id',  jwtMiddleware,async (ctx, next) => {
    await controller.index(ctx)
})
export default router
