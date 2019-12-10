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
            "id": 1782363,
            "model_type": "Ad",
            "model_id": 830,
            "clicktimestamp": "2018-07-25 05:22:12",
            "ipaddress": "::1",
            "source": null,
            "app_type": "PRICEPAL-Redirector",
            "app_version": "2",
            "platform_type": "folo",
            "platform_version": "2",
            "version": 2
        },
        {
            "id": 1782362,
            "model_type": "Ad",
            "model_id": 830,
            "clicktimestamp": "2018-07-25 05:15:20",
            "ipaddress": "::1",
            "source": null,
            "app_type": "PRICEPAL-Redirector",
            "app_version": "2",
            "platform_type": "folo",
            "platform_version": "2",
            "version": 2
        },
        {
            "id": 1782361,
            "model_type": "Ad",
            "model_id": 830,
            "clicktimestamp": "2018-07-25 05:14:33",
            "ipaddress": "::1",
            "source": null,
            "app_type": "PRICEPAL-Redirector",
            "app_version": "2",
            "platform_type": "folo",
            "platform_version": "2",
            "version": 2
        }
    ]
   
    // Deletes ALL existing entries
    await knex('clicks').truncate()

    //Insert users
    await knex('clicks').insert(seedData)

}
