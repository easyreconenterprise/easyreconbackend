const jwt = require('jsonwebtoken')
const User = require('../models/User') // Assuming the User model exists

// Middleware to check if the user is an admin
exports.checkAdminRole = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)

        if (user && user.role === 'Administrator') {
            next() // Proceed to the next middleware/controller
        } else {
            return res
                .status(403)
                .json({ error: 'You do not have the required permissions' })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error checking user role' })
    }
}
