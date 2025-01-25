const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const Schema = mongoose.Schema

const UserSchema = new Schema({
    fullname: {
        type: String,
        required: [true, 'Fullname is required'],
    },
    company_name: {
        type: String,

        required: [true, 'Company name is required'],
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
    },
    phone: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
    },
    address: {
        type: String,
        unique: true,
        required: [true, 'Address is required'],
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [8, 'Password must not be less than 8 characters'],
    },
    resetLink: {
        data: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['Owner', 'Admin', 'Account Officer', 'User'], // List of allowed roles
        default: 'User', // Default role if none is specified
    },
    lastSwitchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Switch' },
    resetToken: String,
    expireToken: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
})

// // //A DOCUMENT MIDDLEWARE THAT HASHES USER'S PASSWORD
// UserSchema.pre('save', async function (next) {
//     this.password = await bcrypt.hash(this.password, 10)
//     next()
// })

// // // A MIDDLEWARE TO CHECK PASSWORD
// UserSchema.methods.correctPassword = async function (
//     candidatePassword,
//     UserPassword
// ) {
//     return await bcrypt.compare(candidatePassword, UserPassword)
// }

module.exports = mongoose.model('User', UserSchema)
