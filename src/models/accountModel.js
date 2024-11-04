const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema(
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
        domain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Domain',
            required: true,
        },
        internalAccount: { type: String, required: true },
        externalAccount: { type: String },
        accountTitle: { type: String, required: true },
        shortTitle: { type: String },
        currency: { type: String },
        internalRecord: { type: String },
        externalRecord: { type: String },
        // balanceAsPerLedger: { type: String },

        balanceAsPerLedger: {
            type: String,
            default: '0', // Initially set to "0"
        },
        balanceAsPerStmt: { type: String },
        balanceAsPerLedgerDate: { type: Date },
        balanceAsPerStatementDate: { type: Date },
        accountCode: { type: String },
        accountClass: { type: String },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Account', accountSchema)
