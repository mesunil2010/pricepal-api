/**
 * Adding legacy API methods, used by the browser extensions
 * 
 * bg.js
 * 
 * 
	urlTemplates: {
		getVersion: 'https://{api_region}.folo.world/api/{api_key}/{date}/{check}',
		getAllStoreCashback: 'https://{api_region}.folo.world/api/{api_key}/{date}/stores/{check}',
		getStoreCashback: 'https://{api_region}.folo.world/api/{api_key}/{date}/stores/{store_id}/{check}',
		getAllStoreVouchers: 'https://{api_region}.folo.world/api/{api_key}/{date}/vouchers/{check}',
		getStoreVouchers: 'https://{api_region}.folo.world/api/{api_key}/{date}/vouchers/{store_id}/{check}',
		sendClick: 'https://{api_region}.folo.world/api/{api_key}/{date}/click/{store_id}/{check}',
		getSettings: 'https://{api_region}.folo.world/api/{api_key}/{date}/settings/{check}',
		sendEncodeLocationUrl: 'https://{api_region}.folo.world/api/{api_key}/{date}/visit/{encoded_url}/{check}',
		getUsefulLinks: 'https://{api_region}.folo.world/api/{api_key}/{date}/useful-links/{check}',
		getReview: 'https://{api_region}.folo.world/api/{api_key}/{date}/reviews/{store_id}/{check}',
		getDetails: 'https://{api_region}.folo.world/api/{api_key}/{date}/store-details/{store_id}/{check}',
		getOffers: 'https://{api_region}.folo.world/api/{api_key}/{date}/offers/{store_id}/{check}',
		getAllOffers: 'https://{api_region}.folo.world/api/{api_key}/{date}/offers/{store_id}/{check}',
		getCashback: 'https://{api_region}.folo.world/api/{api_key}/{date}/cashback-to-date/{check}'
	}
 * 
 */
import Router from 'koa-router'
import logger from '../logger/log'
import apiKeyValidation from '../middleware/apiKeyValidation'
import legacyHmacValidation from '../middleware/legacyHmacValidation'
import storeAPIRequest from '../middleware/storeAPIRequest'

import LegacyAPIController from '../controllers/LegacyAPIController';
	
const router = new Router()
const validator = apiKeyValidation({})

const legacyValidator = legacyHmacValidation({})
const requestTracker = storeAPIRequest()
const legacyAPIController = new LegacyAPIController()


// -- Legacy v1 API (2.5) methods yet to be ported over
router.get("/api/v1/addon/authenticate", async (ctx, next) => {
	await legacyAPIController.testAuthentication(ctx);
})
// -- version / default
router.get('/api/:user_id/:timestamp/:hmac_check', legacyValidator, async (ctx, next) => {
	await legacyAPIController.getVersion(ctx);
})
// -- getUsefulLinks
router.get('/api/:user_id/:timestamp/useful-links/:hmac_check', legacyValidator, async (ctx, next) => {
	await legacyAPIController.getUsefulLinks(ctx);
})

// -- getSettings
router.get('/api/:user_id/:timestamp/settings/:hmac_check',legacyValidator,requestTracker,async (ctx, next) => {
	await legacyAPIController.getSettings(ctx);
})
// -- getCashback
router.get('/api/:user_id/:timestamp/cashback-to-date/:hmac_check',legacyValidator,async (ctx, next) => {
	await legacyAPIController.getUserTransactionTotal(ctx);
})

// --  geAllStoreCashback
router.get('/api/:user_id/:timestamp/stores/:hmac_check',legacyValidator,requestTracker, async (ctx, next) => {
	await legacyAPIController.getStores(ctx);
})
router.get('/api/:user_id/:timestamp/stores/:category_id/:hmac_check',legacyValidator, async (ctx, next) => {
	await legacyAPIController.getStoresByCategory(ctx);
})

//-- getStoreCashback

// -- getAllStoreVouchers
router.get('/api/:user_id/:timestamp/vouchers/:hmac_check',legacyValidator,  async (ctx, next) => {
	await legacyAPIController.getAllStoreVouchers(ctx);
})

// -- getStoreVouchers

// -- sendClick
router.get('/api/:user_id/:timestamp/click/:merchant_id/:hmac_check', legacyValidator, async (ctx, next) => {
	await legacyAPIController.actionUserClick(ctx);
})

// -- sendEncodeLocationUrl
router.get('/api/:user_id/:timestamp/visit/:encoded_url/:hmac_check', async (ctx, next) => {
	// this has been removed and should not be coded against. Older clients such as the FOLO Bar may still call it if the visitdatacollection in /settings is not false
	ctx.throw(410, "RESOURCE_DEPRECATED")
})

// -- getReview

// -- getDetails
router.get('/api/:user_id/:timestamp/store-details/:merchant_id/:hmac_check',legacyValidator,  async (ctx, next) => {
	//hotels - 1750
	await legacyAPIController.getMerchantDetails(ctx);
})


router.get('/api/:user_id/:timestamp/store-categories/:hmac_check',legacyValidator,  async (ctx, next) => {
//router.get('/api/v1/store-categories/',  async (ctx, next) => {
	console.log('store-categories')
	await legacyAPIController.getMerchantCategories(ctx);
})
// -- getOffers

// -- getAllOffers


export default router
