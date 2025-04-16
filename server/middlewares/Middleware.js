const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const algorithm = 'aes-256-cbc';
const key = Buffer.alloc(32, 0);  // Use a fixed 32-byte key
const iv = Buffer.alloc(16, 0);   // Use a fixed 16-byte IV
const jwt = require('jsonwebtoken')
require('dotenv').config()
const multer = require('multer')
const path = require('path')
exports.RegEmailTemplate = (name,verifylink)=>{
    return `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to BeCarefull</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .verify-button {
            display: inline-block;
            background-color: #6a0dad;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
        .footer a {
            color: #6a0dad;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">BeCarefull</div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Welcome to <strong>BeCarefull</strong>! We're excited to have you on board.</p>
            <p>To complete your registration and verify your email address, please click the button below:</p>
            <a href="${verifylink}" class="verify-button">Verify</a>
            <p>If you didn’t sign up for <strong>BeCarefull</strong>, please disregard this email or contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@allegraaudio.com">support@allegraaudio.com</a>.</p>
            <p>© 2024 AllegraAudio. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
}
exports.ResetEmailTemplate = (name,resetlink)=>{
    return `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to BeCarefull</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .verify-button {
            display: inline-block;
            background-color:rgb(140, 19, 201);
           color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
        .footer a {
            color: #6a0dad;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">BeCarefull</div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Welcome to <strong>BeCarefull</strong>! We're excited to have you on board.</p>
            <p>To complete your registration and verify your email address, please click the button below:</p>
            <a href="${resetlink}" class="verify-button">Reset Password</a>
            <p>If you didn’t sign up for <strong>BeCarefull</strong>, please disregard this email or contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@BeCarefull.com">support@BeCarefull.com</a>.</p>
            <p>© 2024 BeCarefull. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
}
exports.hashedPassword  = async (password) => {
    const saltRounds = 10
    const hashedPassword = bcrypt.hash(password, saltRounds)
    return hashedPassword
}
exports.customEncrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};
exports.customdecrypt = function (encryptedText) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
};

exports.genratetoken = (payload) =>{
    try{
        return jwt.sign(payload,process.env.SECRET_KEY, {expiresIn: '24hr'})
    }
    catch(err){
        console.err('Error Genrating in Token:',err.message)
    }
}
exports.verifytoken = (token) => {
    try{
        return jwt.verify(token,process.env.SECRET_KEY)
    }
    catch(err){
        console.log('Error Verifying Token:',err.message)   
        return res.status(401).json({ message: 'Invalid token' });    
    }
}
exports.checktoken = (req,res,next) =>{
    const token = req.headers['token']
    if(!token){
        return res.status(401).json({success: false,message: 'No token provided',statuscode: 401})
    }
    try{
        const decoded = exports.verifytoken(token)
        req.user = decoded.user
        next()
    }
    catch(err){
        console.error('Token verification error:', err.message)
        return res.status(401).json({success: false,message: 'Invalid token',statuscode: 401})
    }
}

const storage = multer.diskStorage({
    destination: (req,ile,cb)=>{
        cb(null,path.join(__dirname,'../uploads'))
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); 
    }
})
exports.upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase()); // Fix: file.originalname instead of fileTypes.originalname
        const mimetype = fileTypes.test(file.mimetype);

        if (extName && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, or .png files are allowed!'));
        }
    }
}).fields([
    { name: "file", maxCount: 1 },  
    { name: "files", maxCount: 5 } 
]);