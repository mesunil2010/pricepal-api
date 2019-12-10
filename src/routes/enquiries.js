import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import EnquiryController from '../controllers/EnquiryController'

const koaForm = require('formidable-upload-koa')
const options = {
    uploadDir: `./uploads`,
    keepExtensions: true,
}

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new EnquiryController()

router.get('/api/v2/enquiries', jwtMiddleware, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/enquiries/:ids', jwtMiddleware, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/enquiries', jwtMiddleware, koaForm(options), async (ctx, next) => {
    await controller.create(ctx)
})

router.put('/api/v2/enquiries/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})
router.del('/api/v2/enquiries/:id', jwtMiddleware, async (ctx, next) => {
    await controller.delete(ctx)
})
export default router
