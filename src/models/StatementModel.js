// const mongoose = require('mongoose')

// const statementSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User', // Assuming you have a User model
//         required: true,
//     },
//     switch: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to Switch model
//         ref: 'Switch',
//         required: true,
//     },
//     PostDate: String,
//     ValDate: String,
//     Details: String,
//     Credit: String,
//     Debit: String,
//     USID: String,
//     uploadedAt: { type: Date, default: Date.now },
// })

// const StatementModel = mongoose.model('Statement', statementSchema)

// module.exports = StatementModel

const mongoose = require('mongoose')

const statementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },
    switch: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Switch model
        ref: 'Switch',
        required: true,
    },
    PostDate: String,
    ValDate: String,
    Details: String,
    Credit: String,
    Debit: String,
    USID: String,
    uploadSessionId: {
        type: mongoose.Schema.Types.ObjectId, // Unique ID per file upload session
        required: true,
    },
    uploadedAt: { type: Date, default: Date.now },
})

const StatementModel = mongoose.model('Statement', statementSchema)

module.exports = StatementModel
