const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Hostinger's SMTP server
    port: 465, // Use 465 with secure: true or 587 with secure: false
    secure: true, // true for port 465, false for 587
    auth:{
        user: "mukeshpabolu@techpixe.com",
        pass: "Mukesh@123"
    },
    tls:{
        rejectUnauthorized: false
    }
})

exports.sendmail = (options)=>{
    let mailoptions = {
        from: 'mukeshpabolu@techpixe.com',
        to:options.to,
        subject:options.subject,
        html:options.text
    }
    try{
        transporter.sendMail(mailoptions)
    }catch(error){
        console.error(error)
    }
}