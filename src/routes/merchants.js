import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import MerchantController from '../controllers/MerchantController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })
const jwtMiddlewareOptional = jwt({ secret: process.env.JWT_SECRET , optional: true})

const koaForm = require('formidable-upload-koa')
const options = {
    uploadDir: `./uploads`,
    keepExtensions: true,
}

const controller = new MerchantController()

router.get('/api/v2/merchants',jwtMiddlewareOptional, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/merchants/categories',jwtMiddlewareOptional, async (ctx, next) => {
    await controller.getCategories(ctx)
})

router.get('/api/v2/merchants/:merchant_ids',jwtMiddlewareOptional, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/merchants', jwtMiddleware, koaForm(options), async (ctx, next) => {
    await controller.create(ctx)
})

router.post('/api/v2/merchants/sync', async (ctx, next) => {
    await controller.syncFromAggregator(ctx)
})

router.put('/api/v2/merchants/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})

router.delete('/api/v2/merchants/:id', jwtMiddleware, async (ctx, next) => {
    await controller.delete(ctx)
})

router.get('/api/v2/merchants/:id/products', jwtMiddlewareOptional,async (ctx, next) => {
    await controller.getProducts(ctx)
})

router.get('/api/v2/merchants/:id/products/:product_id', jwtMiddlewareOptional,async (ctx, next) => {
    await controller.showProducts(ctx)
})

router.post('/api/v2/merchants/:id/products', jwtMiddlewareOptional,async (ctx, next) => {
    await controller.createProducts(ctx)
})

router.put('/api/v2/merchants/:id/products/:product_id', jwtMiddlewareOptional,async (ctx, next) => {
    await controller.updateProducts(ctx)
})

router.delete('/api/v2/merchants/:id/products/:product_id', jwtMiddlewareOptional,async (ctx, next) => {
    await controller.deleteProducts(ctx)
})


export default router
