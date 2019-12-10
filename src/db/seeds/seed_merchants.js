//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

//We don't want seeds to run in production
if (process.env.NODE_ENV === 'production') {
    throw new Error("Can't run seeds in production")
}

const faker = require('faker')

exports.seed = async function(knex, Promise) {
    //Make 100 notes for 10 different users
    let seedData = [
        {
            id: 15,
            name: 'FOLO',
            displayname: 'FOLO',
            joindate:"2006-12-26",
            websiteurl: 'https://store.folo.world/',
            url:"https://store.folo.world/?sub_id=__MBC_TRACKING_INFO_HERE__",
            percentagevaluef:1.15,
            status:'ACTIVE'
        }
    ]
    //id	name	displayname	couponname	sector	websiteurl	joindate	url	linktext	impressionimageurl	cookieinfo	cookieexpiry	cookievalidity	description	conditions	additionalinfo	moneyvaluef	percentagevaluef	impressioncount	clickthrucount	status	affiliatenetwork	acceptenquiries	acceptexistingenquiries	fixedpercentagevaluef	fixedmoneyvaluef	productfeed	country	currency	currenttiercommissions	tiercommissionshistory	alwaysusecommission	dontpromoterebate	seotitle	seodescription	seocontent	showincarousel	leadgenonly	searchtags	ratingscore	specialrate	freeshipping	freereturns	mobileenabled	addon_serp_na	addon_alert_na	wl_checkin_available	wl_keepgiving_available	wl_yourchoyce_available	wl_chaching_available	wl_netbenefits_available	wl_travelfactory_available	wl_rosesonly_available	wl_greatsites_available	wl_rewardsfromus_available	wl_memberrewards_available	wl_folo_available	pricepal_available	folo_addon_serp_na	folo_addon_alert_na	logo_url	sprite_url
//15	FOLO	FOLO	NULL			2006-12-26	https://store.folo.world/?sub_id=__MBC_TRACKING_INFO_HERE__/	FOLO	NULL		2007-06-26	NULL	FOLO internal transactions.			0	0	1	1	EXPIRED	FOLO Direct	1	1	NULL	NULL	NULL	AU	AUD		NULL	0	0	NULL	NULL	NULL	0	0	NULL	NULL	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	1	0	0	0	NULL	NULL

    // Deletes ALL existing entries
    await knex('merchants').truncate()

    //Insert users
    await knex('merchants').insert(seedData)

}
