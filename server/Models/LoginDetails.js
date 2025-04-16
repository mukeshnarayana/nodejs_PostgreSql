const {DataTypes} = require('sequelize')
const sequelize = require('../config/DB')

const Sessions = sequelize.define('Sessions',{
    userid :{
        type: DataTypes.STRING,
        allowNull: false
    },
    jwt :{
        type: DataTypes.STRING,
        allowNull: false
    },
    jwtExpires:{
         type: DataTypes.DATE
    }
},{  timestamps : true,
     tableName: 'logindetails'}
)

module.exports = Sessions