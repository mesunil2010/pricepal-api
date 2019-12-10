import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import BatchesController from '../controllers/BatchController'

const router = new Router()
const jwtMiddleware_requireAdmin = jwt({ secret: process.env.JWT_SECRET ,require_admin: true })

const koaForm = require('formidable-upload-koa')
const options = {
    uploadDir: `./uploads`,
    keepExtensions: true,
}

const controller = new BatchesController()

router.get('/api/v2/batches', jwtMiddleware_requireAdmin, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/batches/estimate', jwtMiddleware_requireAdmin, async (ctx, next) => {
    await controller.estimate(ctx)
})

router.get('/api/v2/batches/:ids', jwtMiddleware_requireAdmin, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/batches', jwtMiddleware_requireAdmin,  async (ctx, next) => {
    await controller.create(ctx)
})

router.post('/api/v2/batches/upload', jwtMiddleware_requireAdmin, koaForm(options), async (ctx, next) => {
    await controller.upload(ctx)
})

router.post('/api/v2/batches/:id', jwtMiddleware_requireAdmin,  async (ctx, next) => {
    await controller.update(ctx)
})
router.del('/api/v2/batches/:id', jwtMiddleware_requireAdmin, async (ctx, next) => {
    await controller.delete(ctx)
})



export default router
