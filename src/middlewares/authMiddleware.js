const jwt = require('jsonwebtoken')

const authenticateUsers = (req, res, next) => {
    console.log('AuthenticateUser middleware executed')

    // Extract token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Unauthorized - Token missing or invalid format')
        return res
            .status(401)
            .json({ error: 'Unauthorized - Token missing or invalid format' })
    }

    const token = authHeader.split(' ')[1]

    try {
        // Verify the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        // Attach user information to the request object
        req.user = decodedToken.user

        if (!req.user || !req.user._id) {
            console.log('Unauthorized - User ID not found in token')
            return res
                .status(403)
                .json({ error: 'Unauthorized - User ID not found in token' })
        }

        next()
    } catch (error) {
        console.log('Unauthorized - Invalid token', error)
        return res.status(401).json({ error: 'Unauthorized - Invalid token' })
    }
}

module.exports = authenticateUsers
