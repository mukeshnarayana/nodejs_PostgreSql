const pool = require('../config/RawDB')
const middle = require('../middlewares/Middleware')

exports.addproduct = async(req , res) =>{
    const {productname,description,price,currency,maincategory,subcategory,stock,rating,ispublished,availability,ProductDetails,salecount} = req.body
    if(!productname || !description || !price || !currency || !maincategory || !subcategory || !stock || !rating || !ispublished || !availability || !salecount){
        return res.status(400).json({message:'Please fill all the fields'})
    }
    const {token} = req.headers
    if(!token){
        return res.status(400).json({success:false,message:'No token provided',statuscode:400})
    }
    try{
        const decoded = middle.verifytoken(token)
        const user = decoded.user.id 
        if(!user){
            return res.status(400).json({success:false,message:'Invalid token',statuscode:400})
        }
        const email = user
        const userrole = await pool.query('select role from public.users where email = $1',[email])
        if(userrole === 'user'){
            return res.status(403).json({success:false,message:'You are not authorized to add products',statuscode:403})
        }
        const product = await pool.query(
            'insert into public.products (productname,description,price,currency,maincategory,subcategory,stock,rating,ispublished,availability,"ProductDetails",salecount,"createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *',
            [productname,description,price,currency,maincategory,subcategory,stock,rating,ispublished,availability,ProductDetails,salecount,new Date(),new Date()]
        )
        const userresult = await pool.query('select id from public.users where email = $1',[email])
        const id = userresult.rows[0].id
        const sessioResult = await pool.query('select * from public.logindetails where id = $1',[id])
        const sessionExists = sessioResult.rows.length > 0;
        if(!sessionExists){
            return res.status(404).json({success:false,message:'You are logged out. Please log in again to continue.',statuscode:404})
        }
        return res.status(200).json({success:true,message:'Product added successfully',statuscode:200})


    }
    catch(err){
        console.error(`Error adding product: ${err.message}`,)
        return res.status(500).json({success:false,message:`Internal server error ${err.message}`,statuscode:500})
    }
} 
exports.getallproducts = async(req,res) =>{
    const{token} = req.headers
    if(!token){
        return res.status(400).json({success:false,message:'No token provided',statuscode:400})
    }
    try{
        const decoded = middle.verifytoken(token)
        const user = decoded.user.id 
        if(!user){
            return res.status(400).json({success:false,message:'Invalid token',statuscode:400})
        }
        const allproducts = await pool.query('select * from public.products')
        if(!allproducts){
            return res.status(404).json({success:false,message:'No products found',statuscode:404})
        }
        const email = user
        const userresult = await pool.query('select id from public.users where email = $1',[email])
        const id = userresult.rows[0].id
        const sessioexists = await pool.query('select * from public.logindetails where id = $1',[id])
        if(!sessioexists){
            return res.status(404).json({success:false,message:'You are logged out. Please log in again to continue.',statuscode:404})
        }
        return res.status(200).json({success:true,message:'Products fetched successfully',statuscode:200,products:allproducts})
    }
    catch(err){
        console.error(`Error getting products: ${err.message}`,)
        return res.status(500).json({success:false,message:`Internal server error ${err.message}`,statuscode:500})
    }
}
exports.getsingleproduct = async(req,res) =>{
    const {productid} = req.params
    if(!productid){
        return res.status(400).json({success:false,message:'Please provide product id',statuscode:400})
    }
    const {token} = req.headers
    if(!token){
        return res.status(400).json({success:false,message:'No token provided',statuscode:400})
    }
    try{
        const decoded = middle.verifytoken(token)
        const user = decoded.user.id
        if(!user){
            return res.status(400).json({success:false,message:'Invalid token',statuscode:400})
        }
        const singleproduct = await pool.query('select * from public.products where id = $1',[productid])
        if(!singleproduct){
            return res.status(404).json({success:false,message:'Product not found',statuscode:404})
        }
        const email = user
        const userresult = await pool.query('select id from public.users where email = $1',[email])
        const id = userresult.rows[0].id
        const sessioExists = await pool.query('select * from public.logindetails where id = $1',[id])
        if(!sessioExists){
            return res.status(404).json({success:false,message:'You are logged out. Please log in again to continue.',statuscode:404})
        }
        return res.status(200).json({success:true,message:'Product fetched successfully',statuscode:200,product:singleproduct})
    }
    catch(err){
        console.error(`Error getting product: ${err.message}`,)
        return res.status(500).json({success:false,message:`Internal server error ${err.message}`,statuscode:500})
    }

}
exports.updateproduct = async(req,res)=>{
    const {token} = req.headers
    if(!token){
        return res.status(400).json({success:false,message:'please provide token',statuscode:400})
    }
    const {productid} = req.params
    if(!productid){
        return res.status(400).json({success:false,message:'please provide product id',statuscode:400})
    }
    try{
        const decoded =  await middle.verifytoken(token)
        const email = decoded.user.id 
        const  user = await pool.query('select * from public.users where email = $1',[email])
        if(!user){
            return res.status(400).json({success:false,message:'user not found',statuscode:400})
        }
        const userrole = user.rows[0].role 
        if(userrole === 'user'){
            return res.status(400).json({success:false,message:'u r unotharized only admin can edit the products',statuscode:400})
        }
        const updatefields = req.body 
        const keys = Object.keys(updatefields)
        const values = Object.values(updatefields)

        if(keys.length === 0){
            return res.status(400).json({success:false,message:'No update data provided',statuscode:400})
        }

        const setclause = keys.map((key,index)=>`${key} = $${index + 1}`).join(', ')
        const updatequery = `update public.products set ${setclause} where id = $${keys.length + 1} returning *`
        const updatevalues = [...values,productid] 
        const updatedResult = await pool.query(updatequery,updatevalues)
        if(updatedResult.rows.length === 0){
            return res.status(404).json({success:false,message:'Product not found',statuscode:404})
        }

        return res.status(200).json({success:true,message:'Product updated successfully',statuscode:200,product:updatedResult.rows[0]})
        
    }
    catch(err){
        console.error(`Error getting product: ${err.message}`,)
        return res.status(500).json({success:false,message:`Internal server error ${err.message}`,statuscode:500})
    }
}
exports.deleteproduct = async(req,res)=>{
    const {token} = req.headers
    if(!token){
        return res.status(400).json({success:false,message:'please provide token',statuscode:400})
    }
    const {productid} = req.params
    if(!productid){
        return res.status(400).json({success:false,message:'please provide product id',statuscode:400})
    }
    try{
        const decoded =  await middle.verifytoken(token)
        const email = decoded.user.id 
        const  user = await pool.query('select * from public.users where email = $1',[email])
        if(!user){
            return res.status(400).json({success:false,message:'user not found',statuscode:400})
        }
        const userrole = user.rows[0].role 
        if(userrole === 'user'){
            return res.status(400).json({success:false,message:'u r unotharized only admin can edit the products',statuscode:400})
        }
        const deleteproduct = await pool.query('delete from public.products where id = $1 returning *',[productid])
        if(deleteproduct.rowCount === 0){
            return res.status(404).json({success:false,message:'Product not found',statuscode:404})
        }
        return res.status(200).json({success:true,message:'Product deleted successfully',statuscode:200,product:deleteproduct.rows[0]})

    }
    catch(err){
        console.error(`Error getting product: ${err.message}`,)
        return res.status(500).json({success:false,message:`Internal server error ${err.message}`,statuscode:500})
    }
}
