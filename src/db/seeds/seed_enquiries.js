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
            "serialnum": 8000,
            "type": "MISSING",
            "user_id": 107624,
            "merchantid": 3402,
            "merchantname": "Big Merchant",
            "transactiondate": "02-Aug-2018 03:11:00 AEST",
            "orderref": "7952149347249",
            "transactionamount": "140.81",
            "moneybackamount": "0.87",
            "additionalinfo": "Additional information (If you can include what products you bought this may aid our enquiries).",
            "status": "Sent to Network",
            "applicable_level": "USER_3",
            "applicable_rebate": 1.32361,
            "commission_due": 2.11215,
            "version": 1,
            "in_freshdesk": 1
        },
        {
            "serialnum": 8001,
            "type": "MISSING",
            "user_id": 107624,
            "merchantname": "Big Merchant",
            "merchantid": 3402,
            "transactiondate": "02-Aug-2018 03:11:00 AEST",
            "orderref": "7952149347249",
            "transactionamount": "140.81",
            "moneybackamount": "0.87",
            "additionalinfo": "Additional information (If you can include what products you bought this may aid our enquiries).",
            "status": "Sent to Network",
            "applicable_level": "USER_3",
            "applicable_rebate": 1.32361,
            "commission_due": 2.11215,
            "version": 1,
            "in_freshdesk": 1
        },
        {
            "serialnum": 8002,
            "type": "MISSING",
            "user_id": 107624,
            "merchantid": 3402,
            "merchantname": "Big Merchant",
            "transactiondate": "02-Aug-2018 03:11:00 AEST",
            "orderref": "7952149347249",
            "transactionamount": "140.81",
            "moneybackamount": "0.87",
            "additionalinfo": "Additional information (If you can include what products you bought this may aid our enquiries).",
            "status": "Sent to Network",
            "applicable_level": "USER_3",
            "applicable_rebate": 1.32361,
            "commission_due": 2.11215,
            "version": 1,
            "in_freshdesk": 1
        }
    ]
   
    // Deletes ALL existing entries
    await knex('enquiries').truncate()

    //Insert users
    await knex('enquiries').insert(seedData)

}
