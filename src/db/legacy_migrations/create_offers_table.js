//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('offers', function(table) {
        table.increments('id').primary()
        table.string('title')
        table.string('type')
        table.string('preface')
        table.string('postscript')
        table.string('coupon')
        table.timestamp('added_date')
        table.timestamp('valid_from_date')
        table.timestamp('expire_date')
        table.integer('merchant_id').defaultTo(0)
        table.string('status')
    })
}
/*
CREATE TABLE `offers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL DEFAULT 'COUPON',
  `title` text NOT NULL,
  `preface` text,
  `postscript` text,
  `coupon` text,
  `added_date` datetime NOT NULL,
  `valid_from_date` date DEFAULT NULL,
  `expire_date` date DEFAULT NULL,
  `merchant_id` int(10) unsigned NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('offers')
    }
}
