import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import ClickController from '../controllers/ClickController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new ClickController()

router.get('/api/v2/clicks', jwtMiddleware, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/clicks/:ids', jwtMiddleware, async (ctx, next) => {
    await controller.show(ctx)
})

export default router
