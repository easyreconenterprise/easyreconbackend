// const mongoose = require('mongoose')

// const RuleSchema = new mongoose.Schema(
//     {
//         ruleKey: {
//             type: String,
//             required: true,
//         },
//         ruleValue: {
//             type: mongoose.Schema.Types.Mixed, // Allows different data types
//             required: true,
//         },
//         uploadSessionId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'UploadSession', // Assuming you have a model for UploadSession
//             required: true,
//         },
//         switchId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Switch', // Assuming you have a model for Switch
//             required: true,
//         },
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User', // To associate rule with the authenticated user
//             required: true,
//         },
//     },
//     { timestamps: true }
// )

// const RuleModel = mongoose.model('Rule', RuleSchema)

// module.exports = RuleModel
const mongoose = require('mongoose')

const RuleSchema = new mongoose.Schema(
    {
        allowUSID: {
            type: Boolean,
            default: false, // Default to false if unchecked
        },
        ledgerKeyword: {
            type: String,
        },
        statementKeyword: {
            type: String,
        },
        order: {
            type: Number,
        },
        statementSequence: {
            type: String,
            default: null, // Optional field for statement sequence
        },
        ledgerSequence: {
            type: String,
            default: null, // Optional field for ledger sequence
        },
        forReversals: {
            type: Boolean,
            default: false, // Tracks if rule is for reversals
        },
        enableSpecialChars: {
            type: Boolean,
            default: false, // Option to allow special characters
        },
        allowAlphanumeric: {
            type: Boolean,
            default: false, // Option to allow alphanumeric characters
        },
        matchingScope: {
            type: String,
            enum: ['Ledger', 'Statement', 'Both'],
            default: 'Both', // Defines matching scope
        },
        delimitLedger: {
            type: String,
            default: null, // Optional field for ledger delimiter
        },
        delimitStatement: {
            type: String,
            default: null, // Optional field for statement delimiter
        },
        matchingType: {
            type: String,
            enum: ['Exact References', 'Sub-characters'],
            default: 'Exact References', // Rule matching type
        },
        omitLedgerChars: {
            type: Number,
            default: 0, // No of characters to omit after ledger word
        },
        countLedgerChars: {
            type: Number,
            default: 0, // No of characters to count after ledger word
        },
        omitStatementChars: {
            type: Number,
            default: 0, // No of characters to omit after statement word
        },
        countStatementChars: {
            type: Number,
            default: 0, // No of characters to count after statement word
        },
        extendedSettings: {
            type: Boolean,
            default: false, // Tracks if extended settings are used
        },
        noOfMatchesDetails: {
            type: Number,
            default: null, // No of matches details if extended settings used
        },
        // uploadSessionId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'UploadSession', // Reference to upload session model (if exists)
        //     required: true, // Ensure it is required
        // },
        uploadSessionIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'UploadSession',
                required: true, // Ensure at least one upload session
            },
        ],
        switchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Switch', // Reference to switch model (if exists)
            required: true, // Ensure it is required
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Rule', RuleSchema)
