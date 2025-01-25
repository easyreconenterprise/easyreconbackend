const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')
const UserAccessSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
    },
    fullname: {
        type: String,
        required: [true, 'Fullname is required'],
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['Account Officer', 'Administrator', 'Supervisor'], // Example roles
    },
    affiliateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Affiliate',
        required: [true, 'Affiliate ID is required'],
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account ID is required'],
    },
    daysOfWeek: {
        type: [String], // Array to hold days of the week
        enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
        ],
        required: [true, 'Days of the week are required'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must not be less than 8 characters'],
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    passwordChangedAt: Date,

    expireToken: Date,
    resetLink: {
        data: String,
        default: '',
    },
})

UserAccessSchema.pre('save', async function (next) {
    if (this.isModified('password') && !this.password.startsWith('$2a$')) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

module.exports = mongoose.model('UserAccess', UserAccessSchema)
