const express = require('express')

// const { signupDto } = require('../validators/user')
const {
    signUp,
    login,
    forgotPassword,
    getProfile,
    // forgotLink,
} = require('../controllers/authController')
const { protect } = require('../middlewares/protectUser')
// const { resetDto } = require('../validators/resetPassword')
// const authRouter = express.Router()
const router = express.Router()
// authRouter.route('/signup').post(signupDto, signUp)

// authRouter.route('/reset/password').post(resetDto, resetPassword)

// router.post('/login', signin);
router.post('/signup', signUp)
router.post('/login', login)
router.get('/profile', protect, getProfile) // New route for fetching profile
router.put('/forgotpassword', forgotPassword)
router.post('/forgotpassword', forgotPassword)
// router.post('/sendpasswordlink', forgotLink)
//  authRouter
//  .route('/reset/password')
//  .post(resetDto, resetPassword);

module.exports = router
