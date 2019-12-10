//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) { throw new Error('NODE_ENV not set') }

require('dotenv').config();

module.exports = {
    development: {
        client: 'mysql',
        debug: false,
        connection: {
            host: process.env.LEGACY_DB_HOST,
            port: process.env.LEGACY_DB_PORT,
            user: process.env.LEGACY_DB_USER,
            password: process.env.LEGACY_DB_PASSWORD,
            database: process.env.LEGACY_DB_DATABASE+'_dev',
        },
    },
    legacy_staging: {
        client: 'mysql',
        debug: false,
        connection: {
            host: process.env.LEGACY_DB_HOST,
            port: process.env.LEGACY_DB_PORT,
            user: process.env.LEGACY_DB_USER,
            password: process.env.LEGACY_DB_PASSWORD,
            database: process.env.LEGACY_DB_DATABASE,
        },
    },
    production: {
        client: 'mysql',
        debug: false,
        connection: {
            host: process.env.LEGACY_DB_HOST,
            port: process.env.LEGACY_DB_PORT,
            user: process.env.LEGACY_DB_USER,
            password: process.env.LEGACY_DB_PASSWORD,
            database: process.env.LEGACY_DB_DATABASE,
        },
    },
    testing: {
        client: 'mysql',
        debug: false,
        connection: {
            host: process.env.LEGACY_DB_HOST,
            port: process.env.LEGACY_DB_PORT,
            user: process.env.LEGACY_DB_USER,
            password: process.env.LEGACY_DB_PASSWORD,
            database: process.env.LEGACY_DB_DATABASE+'_test',
        },
        migrations: {
            directory: './src/db/legacy_migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
}
