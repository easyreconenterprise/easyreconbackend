const express = require('express')
const {
    CreateUser,
    ResetPassword,
    getUsers,
} = require('../controllers/authController')
// const { checkAdminRole } = require('../middlewares/checkAdmin') // Assuming you have some middleware for verification
const authenticateUser = require('../middlewares/authenticateUser')

const router = express.Router()

// Route to create a user and associate with an account
router.post('/add-user', authenticateUser, CreateUser)
router.get('/get-users', authenticateUser, getUsers)

router.post('/reset-password', ResetPassword)

module.exports = router
