//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('merchants', function(table) {
        table.increments('id').primary()
        table.string('name')
        table.string('displayname')
        table.string('couponname')
        table.string('sector')
        table.string('websiteurl')
        table.timestamp('joindate')
        table.string('url')
        table.string('linktext')
        table.string('impressionimageurl')
        table.string('cookieinfo')
        table.timestamp('cookieexpiry')
        table.integer('cookievalidity').nullable()

        table.string('description')
        table.string('conditions')
        table.string('additionalinfo')
        table.float('moneyvaluef')
        table.float('percentagevaluef')

        table.integer('impressioncount').defaultTo(0)
        table.integer('clickthrucount').defaultTo(0)
        table.string('status').defaultTo('ACTIVE')
        table.string('affiliatenetwork').defaultTo('clixGalore')
        table.integer('acceptenquiries').defaultTo(1)
        table.integer('acceptexistingenquiries').defaultTo(1)
        table.float('fixedpercentagevaluef')
        
        table.float('fixedmoneyvaluef')
        table.string('productfeed')
        table.string('country').defaultTo('AU')
        table.string('currency').defaultTo('AUD')
        table.string('currenttiercommissions')
        table.string('tiercommissionshistory')
        table.integer('alwaysusecommission').defaultTo(0)
        table.integer('dontpromoterebate').defaultTo(0)
        table.string('seotitle')
        table.string('seodescription')
        table.string('seocontent')

        table.integer('showincarousel').defaultTo(0)
        table.integer('leadgenonly').defaultTo(0)
        table.string('searchtags')
        table.float('ratingscore')
        table.integer('specialrate').defaultTo(0)
        table.integer('freeshipping').defaultTo(0)
        table.integer('freereturns').defaultTo(0)
        table.integer('mobileenabled').defaultTo(0)
        table.integer('addon_serp_na').defaultTo(0)
        table.integer('addon_alert_na').defaultTo(0)
        table.integer('wl_checkin_available').defaultTo(1)

        table.integer('wl_keepgiving_available').defaultTo(1)
        table.integer('wl_yourchoyce_available').defaultTo(1)
        table.integer('wl_chaching_available').defaultTo(1)
        table.integer('wl_netbenefits_available').defaultTo(1)
        table.integer('wl_travelfactory_available').defaultTo(1)
        table.integer('wl_rosesonly_available').defaultTo(1)
        table.integer('wl_greatsites_available').defaultTo(1)
        table.integer('wl_rewardsfromus_available').defaultTo(1)
        table.integer('wl_memberrewards_available').defaultTo(1)
        table.integer('wl_folo_available').defaultTo(1)
        table.integer('pricepal_available').defaultTo(1)
        table.integer('folo_addon_serp_na').defaultTo(0)
        table.integer('folo_addon_alert_na').defaultTo(0)

        table.string('logo_url')
        table.string('sprite_url')
        table.string('folo_url')
        table.float('folo_percentagevaluef')
        table.timestamp('updated_at')
    })
}
/*
CREATE TABLE `merchants` (
    `name` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
    `displayname` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
    `couponname` varchar(50) DEFAULT NULL,
    `sector` varchar(100) CHARACTER SET ascii NOT NULL DEFAULT '',
    `websiteurl` text CHARACTER SET ascii,
    `joindate` date NOT NULL DEFAULT '0000-00-00',
    `url` text CHARACTER SET ascii COLLATE ascii_bin,
    `linktext` text CHARACTER SET ascii COLLATE ascii_bin,
    `impressionimageurl` text CHARACTER SET ascii COLLATE ascii_bin,
    `cookieinfo` text CHARACTER SET ascii,
    `cookieexpiry` date DEFAULT NULL,
    `cookievalidity` tinyint(3) unsigned DEFAULT NULL,

    `wl_keepgiving_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_yourchoyce_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_chaching_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_netbenefits_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_travelfactory_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_rosesonly_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_greatsites_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_rewardsfromus_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_memberrewards_available` tinyint(1) NOT NULL DEFAULT '1',
    `wl_folo_available` tinyint(1) NOT NULL DEFAULT '1',
    `pricepal_available` tinyint(1) NOT NULL DEFAULT '1',
    `folo_addon_serp_na` tinyint(1) NOT NULL DEFAULT '0',
    `folo_addon_alert_na` tinyint(1) NOT NULL DEFAULT '0',
    `logo_url` text,
    `sprite_url` text,
    `folo_url` text,
    `folo_percentagevaluef` float DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`),
    KEY `displayname` (`displayname`),
    FULLTEXT KEY `name_2` (`name`,`displayname`,`description`,`sector`,`websiteurl`,`cookieinfo`),
    FULLTEXT KEY `searchtags` (`searchtags`)
  ) ENGINE=MyISAM AUTO_INCREMENT=4092 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('merchants')
    }
}
