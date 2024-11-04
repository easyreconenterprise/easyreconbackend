const mongoose = require('mongoose')

const domainSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        affiliate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Affiliate',
            required: true,
        },
        domainName: { type: String, required: true },
        domainDescription: { type: String },
        domainDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Domain', domainSchema)
