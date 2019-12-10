import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import UserController from '../controllers/UserController'
import FavouriteMerchantController from '../controllers/FavouriteMerchantController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

const controller = new UserController()
const favouriteController = new FavouriteMerchantController()

router.get('/api/v2/users', jwtMiddleware, async (ctx, next) => {
    await controller.index(ctx)
})

router.get('/api/v2/users/:user_id/balance', jwtMiddleware, async (ctx, next) => {
    await controller.getBalance(ctx)
})

router.get('/api/v2/users/:user_id/referrals', jwtMiddleware, async (ctx, next) => {
    await controller.getReferrals(ctx)
})

router.get('/api/v2/users/:ids', jwtMiddleware, async (ctx, next) => {
    await controller.show(ctx)
})

router.post('/api/v2/users/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})

router.put('/api/v2/users/:id', jwtMiddleware, async (ctx, next) => {
    await controller.update(ctx)
})

router.get('/api/v2/users/:user_id/favourites/', jwtMiddleware, async (ctx, next) => {
    await favouriteController.index(ctx)
})

router.post('/api/v2/users/:user_id/favourites', jwtMiddleware, async (ctx, next) => {
    await favouriteController.create(ctx)
})

router.delete('/api/v2/users/:user_id/favourites/:merchant_id', jwtMiddleware, async (ctx, next) => {
    await favouriteController.delete(ctx)
})

export default router
