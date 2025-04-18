const {Sequelize} = require('sequelize') 
require('dotenv').config()

const sequelize = new Sequelize(
    process.env.DB_Name,
    process.env.DB_User,
    process.env.DB_Password,
    {
        host: process.env.DB_Host,
        dialect: 'postgres',
        port: process.env.DB_Port,
        logging: false
    }
);
module.exports = sequelize