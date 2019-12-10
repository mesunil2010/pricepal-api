//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('merchant_products', function(table) {
        table.increments('id').primary()
        table.string('name')
        table.text('details')
        table.integer('merchant_id').defaultTo(0)
        table.decimal('percentagevaluef',11,2)
        table.decimal('moneyvaluef',11,2)
        table.timestamp('created_at')
        table.timestamp('updated_at')
    })
}
/*
CREATE TABLE `merchant_products` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `percentagevaluef` decimal(11,2) DEFAULT NULL,
  `merchant_id` int(11) unsigned DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4103 DEFAULT CHARSET=utf8;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('merchant_products')
    }
}
