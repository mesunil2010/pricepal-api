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
            "transactionamount": 100,
            "moneybackamount":12.5,
            "bonuscashbackamount": 5,
            "user_currency": 0,
            "status": "Approved",
            "modifytimestamp": "2018-01-17 18:30:42",
            "merchantid": 3796,
            "user_id": 2
        },
    ]
   
    // Deletes ALL existing entries
    await knex('transactions').truncate()

    //Insert users
    await knex('transactions').insert(seedData)

}
