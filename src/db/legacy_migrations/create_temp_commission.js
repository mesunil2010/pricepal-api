//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('temp_commission', function(table) {
        table.increments('id').primary()
        table.integer('merchant_id')
        table.timestamp('start_date').defaultTo(knex.fn.now());
        table.timestamp('end_date').defaultTo(knex.fn.now());
        table.decimal('moneyvaluef',11)
        table.decimal('percentagevaluef',11)
        table.integer('is_deleted')
        table.integer('deleted_by')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at')
        table.timestamp('deleted_at')
    })
}
/*
CREATE TABLE `temp_commission` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `moneyvaluef` decimal(11,2) DEFAULT NULL,
  `percentagevaluef` decimal(11,2) DEFAULT NULL,
  `merchant_id` int(11) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `merchant_id` (`merchant_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('temp_commission')
    }
}
