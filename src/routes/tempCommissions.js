import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import TempCommissionController from '../controllers/TempCommissionController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new TempCommissionController()

router.get('/api/v2/tempcommissions', jwtMiddleware, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/tempcommissions/:ids', jwtMiddleware, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/tempcommissions', jwtMiddleware, async (ctx, next) => {
    await controller.create(ctx)
})

router.put('/api/v2/tempcommissions/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})
router.del('/api/v2/tempcommissions/:id', jwtMiddleware, async (ctx, next) => {
    await controller.delete(ctx)
})
export default router
