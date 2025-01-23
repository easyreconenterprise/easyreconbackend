// const nodemailer = require('nodemailer')

// // Create a transporter object using SMTP transport
// const transporter = nodemailer.createTransport({
//     service: 'gmail', // Use your email service provider, for Gmail
//     auth: {
//         user: process.env.EMAIL_USER, // Your email address (e.g., example@gmail.com)
//         pass: process.env.EMAIL_PASS, // Your email password or application-specific password
//     },
// })

// // Function to send welcome email
// const sendWelcomeEmail = async (to, defaultPassword, userId) => {
//     try {
//         const mailOptions = {
//             from: process.env.EMAIL_USER, // Sender address
//             to, // Recipient's email address
//             subject: 'Welcome to Our Platform', // Email subject
//             text: `Hello,\n\nWelcome to our platform! Your account has been created successfully.
//             Your default password is: ${defaultPassword}.
//             Please use this to log in and reset your password as soon as possible.\n\n
//             If you have any questions, feel free to reach out to us.\n\n
//             User ID: ${userId}`, // Email content
//         }

//         // Send the email
//         const info = await transporter.sendMail(mailOptions)
//         console.log('Email sent: ' + info.response)
//     } catch (error) {
//         console.error('Error sending welcome email:', error)
//         throw new Error('Email sending failed')
//     }
// }

// module.exports = {
//     sendWelcomeEmail,
// }

const nodemailer = require('nodemailer')

// Create a transporter object using SMTP transport (Mailgun settings)
const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org', // Mailgun SMTP server
    port: 465, // Use 587 for TLS (recommended) or 465 for SSL
    secure: true, // Set to true if using port 465 (SSL)
    auth: {
        user: 'postmaster@mail.praiseafk.tech', // Mailgun SMTP username
        pass: 'Praise100%', // Mailgun SMTP password
    },
})

console.log('SMTP Configuration:', {
    host: 'smtp.mailgun.org',
    port: 465,
    secure: true,
    user: 'postmaster@mail.praiseafk.tech',
})

// Function to send a welcome email
// const sendWelcomeEmail = async (to, defaultPassword, userId) => {
//     try {
//         const mailOptions = {
//             from: '"Easy Recon Enterprise" <postmaster@mail.praiseafk.tech>', // Sender address
//             to, // Recipient email
//             subject: 'Welcome to Easy Recon Enterprise', // Email subject
//             text: `Hello,\n\nWelcome to Easy Recon! Your account has been created successfully.
// Your default password is: ${defaultPassword}.
// Please use this to log in and reset your password as soon as possible.\n\n
// If you have any questions, feel free to reach out to us.\n\n
// User ID: ${userId}`, // Plain text content
//             html: `<p>Hello,</p>
// <p>Welcome to Easy Recon! Your account has been created successfully.</p>
// <p><strong>Your default password:</strong> ${defaultPassword}</p>
// <p>Please use this to log in and reset your password as soon as possible.</p>
// <p>If you have any questions, feel free to reach out to us.</p>
// <p><strong>User ID:</strong> ${userId}</p>`, // HTML content
//         }

//         // Send the email
//         const info = await transporter.sendMail(mailOptions)
//         console.log('Email sent: ' + info.response)
//         return info
//     } catch (error) {
//         console.error('Error sending welcome email:', error)
//         throw new Error('Email sending failed')
//     }
// }

const sendWelcomeEmail = async (to, defaultPassword, resetLink) => {
    try {
        const mailOptions = {
            from: '"Easy Recon Enterprise" <postmaster@mail.praiseafk.tech>', // Sender address
            to, // Recipient email
            subject: 'Welcome to Easy Recon Enterprise', // Email subject
            text: `Hello,\n\nWelcome to Easy Recon! Your account has been created successfully. 
Your default password is: ${defaultPassword}. 
Please use the following link to reset your password and complete your account setup:\n\n
${resetLink}\n\n
If you have any questions, feel free to reach out to us.\n\n
Thank you,\nEasy Recon Enterprise Team`, // Plain text content
            html: `<p>Hello,</p>
<p>Welcome to Easy Recon! Your account has been created successfully.</p>
<p><strong>Your default password:</strong> ${defaultPassword}</p>
<p>Please use the following link to reset your password and complete your account setup:</p>
<p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
<p>If you have any questions, feel free to reach out to us.</p>
<p>Thank you,<br/>Easy Recon Enterprise Team</p>`, // HTML content
        }

        // Send the email
        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent: ' + info.response)
        return info
    } catch (error) {
        console.error('Error sending welcome email:', error)
        throw new Error('Email sending failed')
    }
}

module.exports = {
    sendWelcomeEmail,
}
