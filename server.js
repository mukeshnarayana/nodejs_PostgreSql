const express = require('express')
require('dotenv').config()
const sequelize = require('./server/config/DB')
const UserRouter = require('./server/Routers/Users')
const ProductRouter = require('./server/Routers/Products')
const app = express() 



app.use(express.json())

//Routers
app.use('/users',UserRouter)
app.use('/products',ProductRouter)
//models
const Users = require('./server/Models/Users')
const Sessions = require('./server/Models/LoginDetails')
const Products = require('./server/Models/Products')
sequelize.sync({alter: true})
.then(()=>{
    console.log('Database synced!')
})
.catch(err => {
    console.error('Sync error',err);
})


const port = process.env.Port
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})