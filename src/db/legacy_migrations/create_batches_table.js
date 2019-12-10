//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('batches', function(table) {
        table.increments('id').primary()
        table.decimal('amount')
        table.string('currency').defaultTo('AUD')
        table.string('status').defaultTo('pending')
        table.string('notes')
        
        table.timestamp('created_at')
        table.timestamp('paid_at')
        table.integer('is_deleted').defaultTo(0)

    })
}

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('batches')
    }
}
