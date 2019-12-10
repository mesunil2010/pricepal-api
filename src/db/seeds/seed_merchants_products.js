//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

//We don't want seeds to run in production
if (process.env.NODE_ENV === 'production') {
    throw new Error("Can't run seeds in production")
}

const faker = require('faker')

exports.seed = async function(knex, Promise) {
    //Make 100 notes for 10 different users
    let seedData = [
        {
            "name": "test1",
            "details": "This is test",
            "percentagevaluef": 3.20,
            "merchant_id": 15
        },
        {
            "name": "test2",
            "details": "This is test",
            "percentagevaluef": 4.80,
            "merchant_id": 15
        },
        {
            "name": "test3",
            "details": "This is test",
            "percentagevaluef": 3.22,
            "merchant_id": 15
        }
    ]

    // Deletes ALL existing entries
    await knex('merchant_products').truncate()

    //Insert users
    await knex('merchant_products').insert(seedData)

}
