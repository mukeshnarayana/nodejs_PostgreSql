const {DataTypes} = require('sequelize')
const sequelize = require('../config/DB')

const products = sequelize.define('products',{
      productname:{
        type: DataTypes.STRING,
        allowNull: false,
        required: true
      },
      description:{
        type: DataTypes.STRING,
        allowNull: false,
        required: true
      },
      price:{
            type: DataTypes.FLOAT,
            allowNull: false,
            required: true
        }, 
        currency:{
            type: DataTypes.STRING,
            allowNull: false,
            required: true
        },
        maincategory:{
            type: DataTypes.STRING,
            allowNull: false,
            required: true
        },
        subcategory:{
            type: DataTypes.STRING,
            allowNull: false,
            required: true
        },
        stock:{
            type: DataTypes.INTEGER,
            allowNull: false,
            required: true
        },
        rating:{
            type: DataTypes.FLOAT,
            allowNull: false,
            required: true
        },
        ispublished:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        availability:{
            type: DataTypes.STRING,
            enum:['InStock','Out of stock'],
        },
        ProductDetails:{
            type: DataTypes.STRING,
            allowNull: true
        },
        images:{
            type: DataTypes.ARRAY(DataTypes.BLOB),
            allowNull: true
        },
        salecount:{
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
},{
    timestamps: true,
    tableName: 'products'
})

module.exports = products