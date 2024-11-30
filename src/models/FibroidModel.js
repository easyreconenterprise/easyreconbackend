// models/Fibroid.js
const mongoose = require('mongoose')

const FibroidSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Fibroid', FibroidSchema)
