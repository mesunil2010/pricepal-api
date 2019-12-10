//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('favourite_merchants', function(table) {
        table.increments('id').primary()
        table.integer('user_id').notNullable()
        table.integer('merchant_id').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
}

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('favourite_merchants')
    }
}
