const pool = require('../config/RawDB');  // Import the pool for raw SQL queries
const middle = require('../middlewares/Middleware')
const mail = require('../utils/nodemailer')
const bcrypt = require('bcryptjs')
const Sessions = require('../Models/LoginDetails');
const { decode } = require('jsonwebtoken');
const fs = require("fs");
const path = require("path");
exports.signup = async (req , res) => {
    const {name,email,phonenumber,nationality,password,role,isVarified,confirmpassword} = req.body 
    if(!name||!email||!phonenumber||!password||!role||!confirmpassword){
        return res.status(400).json({success: false,message: 'Please provide all required fields',statuscode: 400})
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({success:false, message: 'Invalid email format' ,statuscode:400});
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{6,}$/;
    if(!passwordRegex.test(password)){
        return res.status(400).json({success:false,message:'Password must have one uppercaseletter,letters,one specialcharacter,numbers',statuscode:400});
    }
    if(password !== confirmpassword){
        return res.status(400).json({success:false,message:'Passwords do not match',statuscode:400});
    }
    try{
        const ExistingUser = await pool.query('select * from public.users where email = $1',[email])
        if(ExistingUser.rows.length > 0){
            return res.status(400).json({success: false,message: 'User already exists',statuscode: 400})
        }
        const hashedPassword = await middle.hashedPassword(password)
        const newuser =  await pool.query(
            'insert into public.users (name,email,phonenumber,nationality,password,role,"isVarified","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',
             [name,email,phonenumber,nationality, hashedPassword,role,isVarified ?? false, new Date(), new Date()]
        )
        const[userid,usermail] = await Promise.all([
            //pool.query('select id from public.users where email = $1',[email]),
            //pool.query('select email from public.users where email = $1',[email])
            middle.customEncrypt(newuser.rows[0].id.toString()),
            middle.customEncrypt(newuser.rows[0].email)
        ])
        const verifylink = `http://localhost:3000/verifyaccount/${userid}/${usermail}`
        mail.sendmail({
            to:email,
            subject: 'Account Verification Link',
            text: middle.RegEmailTemplate(name,verifylink)
        })
        res.status(200).json({success:true,message:'Registred Successfully.VerifyLink send via mail',statuscode:200,userid,usermail})
    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: 'Internal server error',statuscode: 500})
    }

}
exports.reverifylink = async(req,res) =>{
    const {email} = req.body 
    if(!email){
        return res.status(400).json({success:false,message:'Email is required',statuscode: 400})
    }
    try{
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success:false,message:'User not found',statuscode: 400})
        }
        if(user.rows[0].isVarified === true){
            return res.status(400).json({success:false,message:'User already verified',statuscode: 400})
        }
        const[userid,usermail] = await Promise.all([
            middle.customEncrypt(user.rows[0].id.toString()),
            middle.customEncrypt(user.rows[0].email)
        ])
        const verifylink = `http://localhost:3000/verifyaccount/${userid}/${usermail}`
        mail.sendmail({
            to:email,
            subject: 'Account Verification Link',
            text: middle.RegEmailTemplate(user.name,verifylink)
        })
        return res.status(200).json({success:true,message:'Verification link sent successfully',statuscode: 200})
    }
    catch(err){
        console.log(err)
        return res.status(400).json({success:false,message:`internal server error ${err.message}`,statuscode:500})
    }
}
exports.verifyaccount = async(req,res) =>{
   const {userid,usermail} = req.body
    if(!userid || !usermail){
         return res.status(400).json({success: false,message: 'Please provide all required fields',statuscode: 400})
    }
    try{
        const decrypteduserid = middle.customdecrypt(userid)
        const decryptedusermail = middle.customdecrypt(usermail) 
        const verifyuser = await pool.query('select * from public.users where id = $1 and email = $2',[decrypteduserid,decryptedusermail])
        if(verifyuser.rows.length === 0){
            return res.status(400).json({success: false,message: 'User not found',statuscode: 400})
        }
        const updateuser = await pool.query('update public.users set "isVarified" = $1 where id = $2 and email = $3 returning *',[true,decrypteduserid,decryptedusermail])
        return res.status(200).json({success: true,message: 'User verified successfully',statuscode: 200,updateuser})
    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: 'Internal server error',statuscode: 500})
    }
}
exports.userlogin = async(req,res)=>{
    const {email,password} = req.body 
    if(!email || !password){
        return res.status(400).json({success: false,message: 'Please provide all required fields',statuscode: 400})
    }
    try{
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success: false,message: 'User not found',statuscode: 400})
        }
        const payload = {user:{id:user.rows[0].email}}
        const token = middle.genratetoken(payload)
         
        const isMatch = await bcrypt.compare(password,user.rows[0].password)
        if(!isMatch){
            return res.status(400).json({success: false,message: 'password is wrong,please check again',statuscode: 400})
        }
        await Sessions.sync();
        const logindetails = await pool.query(
             `insert into public.logindetails (userid,jwt,"jwtExpires","createdAt","updatedAt")
              values ($1,$2,$3,$4,$5) returning *`,
            [
                user.rows[0].id,
                token,
                new Date(Date.now() + 24 * 60 * 60 * 1000), // Token expires in 24 hours,
                new Date(),
                new Date()

            ]
        )
        return res.status(200).json({success: true,message: 'User logged in successfully',statuscode: 200,token,logindetails})

    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: 'Internal server error',statuscode: 500})
    }

}
exports.userdata = async(req,res) => {
   try{
    if(!req.user || !req.user.id){
        console.log(req.user)
        return res.status(401).json({success: false,message: 'Unauthorized',statuscode: 401})
    }
    const user = await pool.query('select * from public.users where email = $1',[req.user.id])
    if(user.rows.length === 0){
        return res.status(400).json({success: false,message: 'User not found',statuscode: 400})
    }
    const { password, isVarified, ...userWithoutSensitiveFields } = user.rows[0];
    return res.status(200).json({success: true,message: 'User data fetched successfully',statuscode: 200,user:userWithoutSensitiveFields})

     
   }
    catch(err){
          console.error(err)
          return res.status(500).json({success: false,message: 'Internal server error',statuscode: 500})
     }
}
exports.forgetpassword = async(req,res) =>{
    const {email} = req.body 
    if(!email){
        return res.status(400).json({success:false,message:'Email is required',statuscode:400})
    }
    try{
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success:false,message:'User not found',statuscode:400})
        }
        const resetlink = `http://localhost:3000/resetpassword/${user.mailid}`
        mail.sendmail({
            to:email,
            subject: 'Reset Password Link',
            text: middle.ResetEmailTemplate(user.name,resetlink)
        })
        return res.status(200).json({success:true,message:'Reset password link sent successfully',statuscode:200})

    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: `Internal server error ${err.message}`,statuscode: 500})
    }
}
exports.resetpassword = async(req,res) =>{
    const {email,newpassword,confirmpassword} = req.body
    if(!email || !newpassword || !confirmpassword){
        return res.status(400).json({success:false,message:'Please provide all required fields',statuscode:400})
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{6,}$/;
    if(!passwordRegex.test(newpassword)){
        return res.status(400).json({success:false,message:'Password must have one uppercaseletter,letters,one specialcharacter,numbers',statuscode:400});
    }
    try{
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success:false,message:'User not found',statuscode:400})
        }
        if(newpassword !== confirmpassword){
            return res.status(400).json({success:false,message:'Passwords do not match',statuscode:400});
        }
        const isSamePassword = await bcrypt.compare(newpassword,user.rows[0].password)
        if(isSamePassword){
            return res.status(400).json({success:false,message:'New password should not be same as old password',statuscode:400})
        }
        const hashedPassword = await middle.hashedPassword(newpassword)                 
        const updateuser = await pool.query('update public.users set password = $1 where email = $2 returning *',[hashedPassword,email])
        return res.status(200).json({success:true,message:'Password updated successfully',statuscode:200,updateuser})
    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: `Internal server error ${err.message}`,statuscode: 500})
    }

}
exports.changepassword = async(req,res)=>{
    const {oldpassword,newpassword,confirmpassword} = req.body 
    if(!oldpassword || !newpassword || !confirmpassword){
        return res.status(400).json({success: false,message: 'Please provide all required fields',statuscode: 400})
    }
    const {token} = req.headers
    if(!token){
        return res.status(401).json({success: false,message: 'No token provided',statuscode: 401})
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{6,}$/;
    if(!passwordRegex.test(newpassword)){
        return res.status(400).json({success:false,message:'Password must have one uppercaseletter,letters,one specialcharacter,numbers',statuscode:400});
    }
    try{
        const decoded = middle.verifytoken(token)
        if(!decoded){
            return res.status(401).json({success: false,message: 'Invalid token',statuscode: 401})
        }
        console.log(decoded)
        const email = decoded.user.id
        console.log(email)
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success: false,message: 'User not found',statuscode: 400})
        }
        const isMatch = await bcrypt.compare(oldpassword,user.rows[0].password)
        if(!isMatch){
            return res.status(400).json({success: false,message: 'Old password is wrong,please check again',statuscode: 400})
        }
        if(newpassword !== confirmpassword){
            return res.status(400).json({success:false,message:'Passwords do not match',statuscode:400});
        }
        const isSamePassword = await bcrypt.compare(newpassword,user.rows[0].password)
        if(isSamePassword){
            return res.status(400).json({success:false,message:'New password should not be same as old password',statuscode:400})
        }
        const hashedPassword = await middle.hashedPassword(newpassword)                 
        const updateuser = await pool.query('update public.users set password = $1 where email = $2 returning *',[hashedPassword,email])
        return res.status(200).json({success:true,message:'Password updated successfully',statuscode:200,updateuser})
    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: `Internal server error ${err.message}`,statuscode: 500})
    }
}
exports.uploadphoto = async (req, res) => {
    try {
        middle.upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message, statuscode: 400 });
            }

            const { token } = req.headers;
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided', statuscode: 401 });
            }

            const decoded = middle.verifytoken(token);
            if (!decoded) {
                return res.status(401).json({ success: false, message: 'Invalid token', statuscode: 401 });
            }

            const email = decoded.user.id;
            const user = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'User not found', statuscode: 400 });
            }

            if (!req.files || !req.files.file || req.files.file.length === 0) {
                return res.status(400).json({ success: false, message: 'No file uploaded', statuscode: 400 });
            }

            const singleFile = req.files.file[0];
            const filePath = path.join(__dirname, '../uploads', singleFile.filename);

            
            const bufferPhoto = fs.readFileSync(filePath);
            const base64photo = bufferPhoto.toString('base64');
            const hashedphoto = await bcrypt.hash(base64photo, 10);
            

            const updateUser = await pool.query(
                'UPDATE public.users SET photo = $1 WHERE email = $2 RETURNING *',
                [hashedphoto, email]
            );

            return res.status(200).json({
                success: true,
                message: 'Photo uploaded successfully',
                statuscode: 200,
                updateUser
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: `Internal server error: ${err.message}`,
            statuscode: 500
        });
    }
};
exports.logout = async(req,res) =>{
    const {token} = req.headers
    if(!token){
        return res.status(401).json({success: false,message: 'No token provided',statuscode: 401})
    }
    try{
        const decoded = middle.verifytoken(token)
        if(!decoded){
            return res.status(401).json({success: false,message: 'Invalid token',statuscode: 401})
        }
        const email = decoded.user.id
        const user = await pool.query('select * from public.users where email = $1',[email])
        if(user.rows.length === 0){
            return res.status(400).json({success: false,message: 'User not found',statuscode: 400})
        }
        const logindetails = await pool.query('delete from public.logindetails where userid = $1',[user.rows[0].id])
        if(logindetails.rowCount === 0){
            return res.status(400).json({success: false,message: 'User not logged in',statuscode: 400})
        }
        return res.status(200).json({success: true,message: 'User logged out successfully',statuscode: 200})
    }
    catch(err){
        console.error(err)
        return res.status(500).json({success: false,message: 'Internal server error',statuscode: 500})
    }
}
