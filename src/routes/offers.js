import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import OfferController from '../controllers/OfferController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new OfferController()

router.get('/api/v2/offers', async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/offers/:ids', async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/offers', jwtMiddleware, async (ctx, next) => {
    await controller.create(ctx)
})

router.put('/api/v2/offers/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})
router.del('/api/v2/offers/:id', jwtMiddleware, async (ctx, next) => {
    await controller.delete(ctx)
})
export default router
