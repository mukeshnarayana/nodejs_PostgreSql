const{ Pool } = require('pg')

const pool = new Pool({
    user: process.env.DB_User,
    host: 'localhost',
    database: process.env.DB_Name,
    password: process.env.DB_Password,
    port: process.env.DB_Port
})


module.exports = pool