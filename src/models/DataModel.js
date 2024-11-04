// const mongoose = require('mongoose')

// const dataSchema = new mongoose.Schema({
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
//     Debit: String,
//     Credit: String,
//     USID: String,
//     uploadedAt: { type: Date, default: Date.now },
// })

// const DataModel = mongoose.model('Data', dataSchema)

// module.exports = DataModel

const mongoose = require('mongoose')

const dataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    switch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Switch',
        required: true,
    },
    PostDate: String,
    ValDate: String,
    Details: String,
    Debit: String,
    Credit: String,
    USID: String,
    uploadSessionId: {
        type: mongoose.Schema.Types.ObjectId, // Unique ID per file upload session
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
})

const DataModel = mongoose.model('Data', dataSchema)

module.exports = DataModel
