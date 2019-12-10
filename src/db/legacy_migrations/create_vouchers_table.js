//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('vouchers', function(table) {
        table.increments('id').primary()
        table.string('title')
        table.string('code')
        table.string('description')
        table.string('conditions')
        table.string('min_user_level')
        table.timestamp('start_date')
        table.timestamp('end_date')
        table.integer('merchant_id').defaultTo(0)
        table.string('status')
        table.integer('is_deleted').defaultTo(0)
        table.integer('deleted_by').defaultTo(0)
        table.timestamp('deleted_at').defaultTo(knex.fn.now());
    })
}
/*
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `merchant_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `conditions` text,
  `min_user_level` varchar(15) NOT NULL DEFAULT 'VISITOR',
  `status` varchar(10) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10974 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('vouchers')
    }
}
