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
            "user_id": 6,
            "merchant_id": 4100
        }
    ]
   
    // Deletes ALL existing entries
    await knex('favourite_merchants').truncate()

    //Insert data
    await knex('favourite_merchants').insert(seedData)

}
