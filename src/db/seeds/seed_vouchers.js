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
            "id": 10973,
            "title": "20% off sitewide",
            "code": "BAD20",
            "description": "*One time use per customer, cannot be used with any other code. Minimum spend $50AUD",
            "conditions": "Terms & Conditions apply, see website for details.",
            "min_user_level": "VISITOR",
            "start_date": "2018-07-12T14:00:01.000Z",
            "end_date": "2018-07-16T13:59:59.000Z",
            "merchant_id": 3887,
            "status": "ACTIVE"
        },
        {
            "id": 10972,
            "title": "Extra 20% off sale",
            "code": "x20July",
            "description": "",
            "conditions": "Terms & Conditions apply, see website for details.",
            "min_user_level": "VISITOR",
            "start_date": null,
            "end_date": "2018-07-14T13:59:59.000Z",
            "merchant_id": 3821,
            "status": "ACTIVE"
        },
        {
            "id": 10971,
            "title": "17% off siteside, Save during Anniversary sale",
            "code": "RGSAVE17",
            "description": "",
            "conditions": "Terms & Conditions apply, see website for details.",
            "min_user_level": "VISITOR",
            "start_date": null,
            "end_date": "2018-07-24T13:59:59.000Z",
            "merchant_id": 4078,
            "status": "ACTIVE"
        }
    ]
   
    // Deletes ALL existing entries
    await knex('vouchers').truncate()

    //Insert users
    await knex('vouchers').insert(seedData)

}
