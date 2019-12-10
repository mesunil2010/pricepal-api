import Router from 'koa-router'
import jwt from '../middleware/jwt'
import logger from '../logger/log'

import UserActionController from '../controllers/UserActionController'

const router = new Router()
const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET })

router.get('/', async (ctx, next) => {
    ctx.body = { message: 'Pricepal API v2:' }

})
router.get('/test', async (ctx, next) => {
    
    await userActionController.test(ctx)
    ctx.body = { message: 'Pricepal API v2: test' }
})

//Initial controller once for all routes
const userActionController = new UserActionController()

router.post('/api/v2/user/signup', async (ctx, next) => {
    await userActionController.signup(ctx)
})
router.post('/api/v2/user/oauthsignup', async (ctx, next) => {
    await userActionController.oauthSignup(ctx)
})

//commented out until frontend ready to support it
/*
router.post('/api/v2/user/login', async (ctx, next) => {
    await userActionController.login(ctx)
})
*/
router.post('/api/v2/user/authenticate', async (ctx, next) => {
    await userActionController.authenticate(ctx)
})

router.post('/api/v2/user/refreshAccessToken', async (ctx, next) => {
    await userActionController.refreshAccessToken(ctx)
}) 

router.post(
    '/api/v2/user/invalidateAllRefreshTokens',
    jwtMiddleware,
    async (ctx, next) => {
        await userActionController.invalidateAllRefreshTokens(ctx)
    }
)

router.post(
    '/api/v2/user/invalidateRefreshToken',
    jwtMiddleware,
    async (ctx, next) => {
        await userActionController.invalidateRefreshToken(ctx)
    }
)

router.post('/api/v2/user/forgot', async (ctx, next) => {
    await userActionController.forgot(ctx)
})

router.post('/api/v2/user/checkPasswordResetToken', async (ctx, next) => {
    await userActionController.checkPasswordResetToken(ctx)
})

router.post('/api/v2/user/resetPassword', async (ctx, next) => {
    await userActionController.resetPassword(ctx)
})

router.post('/api/v2/user/private', jwtMiddleware, async (ctx, next) => {
    await userActionController.private(ctx)
})

router.get(
    '/api/v2/user/client',
    async (ctx, next) => {
        await userActionController.getUserAgentFromRequest(ctx)
    }
)

export default router
