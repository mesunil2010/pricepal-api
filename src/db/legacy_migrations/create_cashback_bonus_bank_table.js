//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('cashback_bonus_bank', function(table) {
        table.increments('id').primary()
        table.integer('user_id').defaultTo(0)
        table.timestamp('date').defaultTo(knex.fn.now());
        table.string('type')
        table.decimal('amount',2)
        table.integer('transaction_id')
        table.string('status')
    })
}
/*
CREATE TABLE `cashback_bonus_bank` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `date` datetime NOT NULL,
  `type` varchar(30) NOT NULL,
  `transaction_id` bigint(20) DEFAULT NULL,
  `amount` double NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26018 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('cashback_bonus_bank')
    }
}
