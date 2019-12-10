import Router from 'koa-router'
import jwt from '../middleware/jwt'

import PaymentController from '../controllers/PaymentController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new PaymentController()

router.get('/api/v2/payments', jwtMiddleware,async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/payments/totals', jwtMiddleware, async (ctx, next) => {
    await controller.total(ctx)
})

export default router
