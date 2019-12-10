import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import EventsController from '../controllers/EventsController'

const router = new Router()

const controller = new EventsController()

router.post('/api/v2/events/clickthrough', async (ctx, next) => {
    await controller.createClickthrough(ctx)
})

export default router
