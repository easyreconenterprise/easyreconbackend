// const jwt = require('jsonwebtoken')

// const authenticateUser = (req, res, next) => {
//     console.log('AuthenticateUser middleware executed')

//     const token = req.headers.authorization
//     console.log('Received token:', token)

//     if (!token || !token.startsWith('Bearer ')) {
//         // Check for 'Bearer ' prefix
//         console.log('Unauthorized - Token missing or invalid format')
//         return res.status(401).json({ error: 'Unauthorized' })
//     }

//     try {
//         const decodedToken = jwt.verify(
//             token.replace('Bearer ', ''), // Remove 'Bearer ' prefix
//             process.env.JWT_SECRET
//         )
//         console.log('Decoded Token:', decodedToken)

//         req.user = decodedToken // Make sure your token payload includes the 'user' property

//         next()
//     } catch (error) {
//         console.log('Unauthorized - Invalid token')
//         return res.status(401).json({ error: 'Invalid token' })
//     }
// }

// module.exports = authenticateUser

// const jwt = require('jsonwebtoken')

// const authenticateUser = (req, res, next) => {
//     console.log('AuthenticateUser middleware executed')

//     // Extract token from Authorization header
//     const authHeader = req.headers.authorization
//     console.log('Authorization header:', authHeader)

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         console.log('Unauthorized - Token missing or invalid format')
//         return res
//             .status(401)
//             .json({ error: 'Unauthorized - Token missing or invalid format' })
//     }

//     const token = authHeader.split(' ')[1]
//     console.log('Token:', token)

//     try {
//         // Verify the token
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
//         console.log('Decoded Token:', decodedToken)

//         // Attach user information to the request object
//         req.user = decodedToken.user

//         if (!req.user || !req.user._id) {
//             console.log('Unauthorized - User ID not found in token')
//             return res
//                 .status(403)
//                 .json({ error: 'Unauthorized - User ID not found in token' })
//         }

//         next()
//     } catch (error) {
//         console.log('Unauthorized - Invalid token', error)
//         return res.status(401).json({ error: 'Unauthorized - Invalid token' })
//     }
// }

// module.exports = authenticateUser

// const jwt = require('jsonwebtoken')

// const authenticateUser = (req, res, next) => {
//     console.log('AuthenticateUser middleware executed')

//     // Extract token from Authorization header
//     const authHeader = req.headers.authorization
//     console.log('Authorization header:', authHeader)

//     // Check if token exists and starts with 'Bearer '
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         console.log('Unauthorized - Token missing or invalid format')
//         return res
//             .status(401)
//             .json({ error: 'Unauthorized - Token missing or invalid format' })
//     }

//     const token = authHeader.split(' ')[1] // Extract the token part
//     console.log('Token:', token)

//     try {
//         // Verify the token
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
//         console.log('Decoded Token:', decodedToken)

//         // Attach user information to the request object
//         req.user = decodedToken // Since the payload is just the ID

//         // Check if user ID is present in the token
//         if (!req.user.id) {
//             console.log('Unauthorized - User ID not found in token')
//             return res
//                 .status(403)
//                 .json({ error: 'Unauthorized - User ID not found in token' })
//         }

//         next() // Proceed to the next middleware or route handler
//     } catch (error) {
//         console.log('Unauthorized - Invalid token', error)
//         return res.status(401).json({ error: 'Unauthorized - Invalid token' })
//     }
// }

// module.exports = authenticateUser
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User') // Owner account model
const UserAccess = require('../models/UserAccess') // Added user model

const authenticateUser = async (req, res, next) => {
    console.log('AuthenticateUser middleware executed')

    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    console.log('Authorization header:', authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Unauthorized - Token missing or invalid format')
        return res
            .status(401)
            .json({ error: 'Unauthorized - Token missing or invalid format' })
    }

    const token = authHeader.split(' ')[1] // Extract the token part
    console.log('Token:', token)

    try {
        // Verify the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        const userId = decodedToken.id

        // Check both models for the user
        let user = await User.findById(userId) // Check owner account first
        if (!user) {
            // If not found in User, check UserAccess
            user = await UserAccess.findById(userId)
            if (!user) {
                console.log('Unauthorized - User not found in both models')
                return res
                    .status(404)
                    .json({ error: 'Unauthorized - User not found' })
            }
        }

        // Attach user information to the request object
        req.user = {
            id: user._id,
            email: user.email,
            model: user instanceof User ? 'User' : 'UserAccess', // Indicate which model the user is from
        }

        next() // Proceed to the next middleware or route handler
    } catch (error) {
        console.log('Unauthorized - Invalid token', error)
        return res.status(401).json({ error: 'Unauthorized - Invalid token' })
    }
}

module.exports = authenticateUser
