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
            id: 768,
            title: null,
            image_name: "768.jpg",
            link: "/Macys-Australia",
            impression_count: 14528,
            click_through_count: 53,
            priority: 5,
            start_date: "2014-09-25T23:32:38.000Z",
            end_date: "2014-09-28T13:59:59.000Z",
            status: "ACTIVE"
        },
        {
            id: 256,
            title: null,
            image_name: "256.png",
            link: "/Adairs",
            impression_count: 2439,
            click_through_count: 13,
            priority: 5,
            start_date: "2014-01-30T21:51:17.000Z",
            end_date: "2014-02-03T12:59:59.000Z",
            status: "ACTIVE"
        }
    ]
   
    // Deletes ALL existing entries
    await knex('ads').truncate()

    //Insert users
    await knex('ads').insert(seedData)

}
