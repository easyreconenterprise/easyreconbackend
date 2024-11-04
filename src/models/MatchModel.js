const mongoose = require('mongoose')
const { Schema } = mongoose

const MatchSchema = new Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    switchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Switch',
        required: true,
    },
    exactMatches: [{ type: Object, required: false }],
    probableMatches: [{ type: Object, required: false }],
    matchedStatements: [{ type: Object, required: false }],
    // unmatchedItems: [{ type: Object, required: false }],

    unmatchedItems: [
        {
            type: {
                type: String,
                enum: ['ledger', 'statement'], // Specify if the unmatched item is from ledger or statement
                required: true,
            },
            details: {
                type: Object, // Store the unmatched item's details
                required: true,
            },
        },
    ],

    uploadSessionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Match', MatchSchema)
