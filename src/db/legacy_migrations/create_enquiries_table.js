//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('enquiries', function(table) {
        table.increments('id').primary()
        table.integer('user_id').defaultTo(0)
        table.integer('serialnum').defaultTo(0)
        table.string('type')
        table.string('transactiondate')
        table.string('orderref')
        table.string('transactionamount')
        table.string('moneybackamount')
        table.string('applicable_level')
        table.decimal('applicable_rebate',2)
        table.decimal('commission_due',2)
        table.text('additionalinfo')
        table.integer('merchantid').defaultTo(0)
        table.string('merchantname')
        table.string('status')
        table.integer('version').defaultTo(0)
        table.integer('in_freshdesk').defaultTo(0)
        table.integer('freshdesk_id').defaultTo(0)
        table.timestamp('createtimestamp').defaultTo(knex.fn.now());
        table.timestamp('modifytimestamp').defaultTo(knex.fn.now());
    })
}
/*
CREATE TABLE `enquiries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Global enquiry ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User ID',
  `serialnum` bigint(20) unsigned NOT NULL,
  `type` char(10) NOT NULL,
  `merchantname` varchar(100) NOT NULL,
  `merchantid` int(11) NOT NULL,
  `transactiondate` varchar(100) NOT NULL,
  `orderref` varchar(100) NOT NULL,
  `transactionamount` varchar(100) DEFAULT NULL,
  `moneybackamount` varchar(100) DEFAULT NULL,
  `additionalinfo` text,
  `applicable_level` char(10) NOT NULL,
  `applicable_rebate` float NOT NULL,
  `commission_due` float NOT NULL,
  `status` char(20) DEFAULT 'Queued',
  `createtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modifytimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `version` tinyint(4) NOT NULL DEFAULT '1',
  `in_freshdesk` tinyint(1) NOT NULL DEFAULT '0',
  `invoice_file_location` varchar(300) DEFAULT NULL,
  `merchant_id` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `serialnum` (`serialnum`)
) ENGINE=InnoDB AUTO_INCREMENT=7015 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('enquiries')
    }
}
