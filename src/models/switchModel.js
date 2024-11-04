const mongoose = require('mongoose')

const switchSchema = new mongoose.Schema(
    {
        affiliate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Affiliate',
            required: true,
        },
        domain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Domain',
            required: true,
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        month: { type: String, required: true }, // Example format: "YYYY-MM"
    },
    { timestamps: true }
)

module.exports = mongoose.model('Switch', switchSchema)
