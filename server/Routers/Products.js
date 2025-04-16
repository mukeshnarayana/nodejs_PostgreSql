const express = require('express')
const ProductRouter = express.Router()
const productController = require('../Controlles/products')

ProductRouter.post('/addproduct',productController.addproduct) 
ProductRouter.get('/getproducts',productController.getallproducts)
ProductRouter.get('/getproduct/:productid',productController.getsingleproduct)
ProductRouter.put('/updateproduct/:productid',productController.updateproduct)
ProductRouter.delete('/deleteproduct/:productid',productController.deleteproduct)
module.exports = ProductRouter