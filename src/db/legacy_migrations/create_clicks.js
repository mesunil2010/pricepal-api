//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('clicks', function(table) {
        table.increments('id').primary()
        table
            .integer('user_id')
            .notNullable()
        table.integer('merchantid')
        .notNullable()
        table.integer('model_id')
        .notNullable()
        table.integer('model_type')
        .notNullable()
        table.timestamp('clicktimestamp')
        .defaultTo(knex.fn.now())

        table.string('ipaddress')
        .nullable()
        table.string('source')
        .nullable()
        table.string('app_type')
        .nullable()
        table.string('app_version')
        .nullable()
        table.string('platform_type')
        .nullable()
        table.string('platform_version')
        .nullable()
        table.string('version')
        .defaultTo(1)
        // for future table
        //table.integer('cause_id')
        //.notNullable()

    })
}

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('clicks')
    }
}
