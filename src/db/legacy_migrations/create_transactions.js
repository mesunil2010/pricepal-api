//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactions', function(table) {
        table.increments('id').primary()
        table
            .integer('user_id')
            .notNullable()
        table.integer('serialnum').nullable()
        table.string('trackingid')
        table.integer('merchantid').nullable()

        table.decimal('transactionamount',2).defaultTo(0)
        table.decimal('moneybackamount',2).defaultTo(0)
        table.decimal('commissionamount',2).defaultTo(0)
        table.decimal('revshareamount',2).defaultTo(0)
        table.decimal('wlrevshareamount',2).defaultTo(0)
        table.decimal('cashbackshareamount',2).defaultTo(0)
        table.decimal('bonuscashbackamount',2).defaultTo(0)
        table.string('status')
        table.string('currency')
        table.decimal('cause_share_amount',2)
        table.integer('aggregator_transaction_id').nullable()
        table.timestamp('aggregator_inserted_at')

        table.integer('aggregator_merchant_id').nullable()
        table.string('aggregator_merchant_name').nullable()
        table.integer('aggregator_network_id').nullable()
        table.decimal('user_currency_transactionamount',2)
        table.decimal('user_currency_cause_share_amount',2)

        table.timestamp('createtimestamp').defaultTo(knex.fn.now())
        table.timestamp('modifytimestamp')
        table.timestamp('approvedimestamp')
        table.timestamp('paidtimestamp')

        //Cloumns for pricepal
        table.string('user_currency',5).defaultTo('AUD')
        table.decimal('user_currency_moneybackamount',2).defaultTo(0)

        table.integer('batch_id').nullable()
    })
}

exports.down = function(knex, Promise) {
    //We never want to drop tables in production
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('transactions')
    }
}
