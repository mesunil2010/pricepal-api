//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('refresh_tokens_v2', function(table) {
        table.increments('id').primary()
        table.string('email').notNullable()
        table.string('refresh_token').notNullable()
        table.string('info')
        table
            .boolean('is_valid')
            .defaultTo(false)
            .notNullable()
        table.timestamp('expiration').nullable()
        table.string('ip_address')
        table.timestamp('updated_at').nullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
}

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('refresh_tokens_v2')
    }
}
