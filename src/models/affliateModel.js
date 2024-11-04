const mongoose = require('mongoose')

const affiliateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        affiliateName: { type: String, required: true },
        affiliateDescription: { type: String },
        affiliateDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Affiliate', affiliateSchema)
