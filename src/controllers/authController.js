// const { AuthService, getUserByEmail } = require('../services/auth')
const { StatusCodes } = require('http-status-codes')
//const { createToken } = require('../../utils/helper')
const User = require('../models/User')
const catchAsync = require('../errors/catchAsync')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { Request } = require('express')
const crypto = require('crypto')

const keysecret = process.env.SECRET_KEY

const SECRET = process.env.JWT_SECRET
const HOST = process.env.SMTP_HOST
const PORT = process.env.SMTP_PORT
const USER = process.env.SMTP_USER
const PASS = process.env.SMTP_PASS
// const signUp = catchAsync(async (req, res) => {
//     const user = await AuthService.createUser(req.body)
//     user.password = undefined

//     return res.status(StatusCodes.CREATED).json({ user })
// })
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD,
//     },
// })

const signUp = async (req, res, next) => {
    const { email } = req.body
    const userExist = await User.findOne({ email })
    if (userExist) {
        return next(new ErrorResponse('E-mail already  registred', 400))
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    const newUser = new User({
        fullname: req.body.fullname,
        company_name: req.body.company_name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,

        password: hashedPassword,
    })
    try {
        const user = await newUser.save()

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET
        )

        res.status(201).json({
            success: true,
            user,
            token, // Include the generated token in the response
        })
    } catch (error) {
        next(error)
    }
}

const login = async (req, res, next) => {
    const { email, password } = req.body

    try {
        // Find the user by username in the database
        const user = await User.findOne({ email })

        // If the user is not found, return an error
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password)

        // If the passwords don't match, return an error
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' })
        }
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
            }
        )
        console.log('JWT Token Issued:', jwt.decode(token).exp)

        // Password is valid, generate a JWT token

        return res.status(200).json({ token, user }) // Include the generated token in the response
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// const login = async (req, res, next) => {
//     const { email, password } = req.body

//     try {
//         if (!email || !password) {
//             throw new AppError(
//                 'Please provide email and password',
//                 StatusCodes.BAD_REQUEST
//             )
//         }

//         const user = await userModel.findOne({ email }).select('+password')
//         console.log(user)

//         if (!user || !(await user.correctPassword(password, user.password))) {
//             throw new AppError(
//                 'Incorrect Email or Password',
//                 StatusCodes.UNAUTHORIZED
//             )
//         }

//         //const token = createToken(user.id)

//         return res.status(StatusCodes.OK).json({
//             message: 'Login Successful',
//             status: true,
//             //token: token,
//         })
//     } catch (err) {
//         next(err)
//     }
// }
// Example usage

const forgotPassword = (req, res) => {
    sendEmail(req.body)
        .then((response) => res.send(response.message))
        .catch((error) => res.status(500).send(error.message))
}
// app.post('/send_recovery_email', (req, res) => {
//     sendEmail(req.body)
//         .then((response) => res.send(response.message))
//         .catch((error) => res.status(500).send(error.message))
// })
// const resetPassword = (req, res) => {
//     const newPassword = req.body.password
//     const sentToken = req.body.token
//     User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
//         .then((user) => {
//             if (!user) {
//                 return res
//                     .status(422)
//                     .json({ error: 'Try again session expired' })
//             }
//             bcrypt.hash(newPassword, 12).then((hashedpassword) => {
//                 user.password = hashedpassword
//                 user.resetToken = undefined
//                 user.expireToken = undefined
//                 user.save().then((saveduser) => {
//                     res.json({ message: 'password updated success' })
//                 })
//             })
//         })
//         .catch((err) => {
//             console.log(err)
//         })
// }

// const forgotPassword = catchAsync(async (req, res) => {
//     await AuthService.changePassword(req.body)

//     res.status(StatusCodes.OK).json({
//         status: true,
//         message: 'Password changed succesfully!',
//     })
// })
// const forgotPassword = (req, res) => {
//     const { email } = req.body

//     // NODEMAILER TRANSPORT FOR SENDING POST NOTIFICATION VIA EMAIL
//     const transporter = nodemailer.createTransport({
//         host: HOST,
//         port: PORT,
//         auth: {
//             user: USER,
//             pass: PASS,
//         },
//         tls: {
//             rejectUnauthorized: false,
//         },
//     })

//     crypto.randomBytes(32, (err, buffer) => {
//         if (err) {
//             console.log(err)
//         }
//         const token = buffer.toString('hex')
//         User.findOne({ email: email }).then((user) => {
//             if (!user) {
//                 return res
//                     .status(422)
//                     .json({ error: 'User does not exist in our database' })
//             }
//             user.resetToken = token
//             user.expireToken = Date.now() + 3600000
//             user.save()
//                 .then((result) => {
//                     transporter.sendMail({
//                         to: user.email,
//                         from: 'Accountill <hello@olaniyihoppee.com>',
//                         subject: 'Password reset request',
//                         html: `
//                     <p>You requested for password reset from Arc Invoicing application</p>
//                     <h5>Please click this <a href="http://localhost:5000/reset/${token}">link</a> to reset your password</h5>
//                     <p>Link not clickable?, copy and paste the following url in your address bar.</p>
//                     <p>http://localhost:5000/reset/${token}</p>
//                     <P>If this was a mistake, just ignore this email and nothing will happen.</P>
//                     `,
//                     })
//                     res.json({ message: 'check your email' })
//                 })
//                 .catch((err) => console.log(err))
//         })
//     })
// }

// const resetPassword = catchAsync(async (req, res) => {
//     await AuthService.changePassword(req.body)

//     res.status(StatusCodes.OK).json({
//         status: true,
//         message: 'Password changed succesfully!',
//     })
// })
// const forgotLink = async (req, res) => {
//     console.log(req.body)

//     const { email } = req.body

//     if (!email) {
//         res.status(401).json({ status: 401, message: 'Enter Your Email' })
//     }

//     try {
//         const userfind = await User.findOne({ email: email })

//         // token generate for reset password
//         const token = jwt.sign({ _id: userfind._id }, keysecret, {
//             expiresIn: '360s',
//         })

//         const setusertoken = await User.findByIdAndUpdate(
//             { _id: userfind._id },
//             { verifytoken: token },
//             { new: true }
//         )

//         if (setusertoken) {
//             const mailOptions = {
//                 from: process.env.EMAIL,
//                 to: email,
//                 subject: 'Sending Email For password Reset',
//                 text: `This Link Valid For 2 MINUTES http://localhost:5000/forgotpassword/${userfind.id}/${setusertoken.verifytoken}`,
//             }

//             transporter.sendMail(mailOptions, (error, info) => {
//                 if (error) {
//                     console.log('error', error)
//                     res.status(401).json({
//                         status: 401,
//                         message: 'email not send',
//                     })
//                 } else {
//                     console.log('Email sent', info.response)
//                     res.status(201).json({
//                         status: 201,
//                         message: 'Email sent Succsfully',
//                     })
//                 }
//             })
//         }
//     } catch (error) {
//         res.status(401).json({ status: 401, message: 'invalid user' })
//     }
// }

// verify user for forgot password time
// const forgotPassword = async (req, res) => {
//     const { id, token } = req.params

//     try {
//         const validuser = await User.findOne({ _id: id, verifytoken: token })

//         const verifyToken = jwt.verify(token, keysecret)

//         console.log(verifyToken)

//         if (validuser && verifyToken._id) {
//             res.status(201).json({ status: 201, validuser })
//         } else {
//             res.status(401).json({ status: 401, message: 'user not exist' })
//         }
//     } catch (error) {
//         res.status(401).json({ status: 401, error })
//     }
// }

module.exports = { signUp, login, forgotPassword, getProfile }
