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
            "user_id": 154168,
            "type": "REFERRED_REGISTER",
            "transaction_id": 1,
            "amount": 20,
            "status": "ACTIVE",
            "date": "2014-10-05 20:14:08"
        },
        {
            "user_id": 154168,
            "type": "REFERRED_REGISTER",
            "transaction_id": 2,
            "amount": 20,
            "status": "ACTIVE",
            "date": "2014-10-05 20:14:08"
        },
        {
            "user_id": 154168,
            "type": "REFERRED_REGISTER",
            "transaction_id": 3,
            "amount": 20,
            "status": "ACTIVE",
            "date": "2014-10-05 20:14:08"
        }
    ]
   
    // Deletes ALL existing entries
    await knex('cashback_bonus_bank').truncate()

    //Insert users
    await knex('cashback_bonus_bank').insert(seedData)

}
