import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import BuddyBonusController from '../controllers/BuddyBonusController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new BuddyBonusController()

router.get('/api/v2/bonuses', jwtMiddleware, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/bonuses/:ids', jwtMiddleware, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/bonuses', jwtMiddleware, async (ctx, next) => {
    await controller.create(ctx)
})

router.put('/api/v2/bonuses/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})
router.del('/api/v2/bonuses/:id', jwtMiddleware, async (ctx, next) => {
    await controller.delete(ctx)
})
export default router
