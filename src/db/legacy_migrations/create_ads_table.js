//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('ads', function(table) {
        table.increments('id').primary()
        table.string('size')
        table.string('image_name')
        table.string('external_image_link')
        table.string('title')
        table.string('link')
        table.string('code')
        table.integer('is_external').defaultTo(0)
        table.integer('new_tab').defaultTo(0)
        table.integer('impression_count').defaultTo(0)
        table.integer('click_through_count').defaultTo(0)
        table.integer('priority').defaultTo(0)

        table.string('locations')
        table.string('location_impression_count')
        table.string('location_click_through_count')

        table.timestamp('start_date')
        table.timestamp('end_date')
        table.string('status')

        table.string('media_id')

        table.integer('is_hot').defaultTo(0)
    })
}
/*
CREATE TABLE `ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `size` varchar(15) NOT NULL,
  `image_name` varchar(50) NOT NULL,
  `external_image_link` varchar(250) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `link` varchar(250) DEFAULT NULL,
  `code` text,
  `is_external` tinyint(1) NOT NULL DEFAULT '0',
  `new_tab` tinyint(1) NOT NULL DEFAULT '0',
  `impression_count` int(11) NOT NULL DEFAULT '0',
  `click_through_count` int(11) NOT NULL DEFAULT '0',
  `priority` int(11) NOT NULL DEFAULT '0',
  `locations` text,
  `location_impression_count` text,
  `location_click_through_count` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `size` (`size`)
) ENGINE=InnoDB AUTO_INCREMENT=4924 DEFAULT CHARSET=latin1;
*/

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('ads')
    }
}
