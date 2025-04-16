const { DataTypes } = require('sequelize')
const sequelize = require('../config/DB')

const Users = sequelize.define('Users', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    phonenumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nationality: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
    },
    isVarified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    photo: {
        type: DataTypes.BLOB,
        allowNull: true,
    }    
}, {
    timestamps: true,
    tableName: 'users'
})

module.exports = Users
