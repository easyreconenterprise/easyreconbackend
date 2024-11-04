const mongoose = require('mongoose')

// Define an array of content fields
const contentFields = ['content30']

// Create an object with content fields and their types
const contentFieldsDefinition = contentFields.reduce((fields, field) => {
    fields[field] = String
    return fields
}, {})

const tenSchema = new mongoose.Schema(
    {
        ...contentFieldsDefinition,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

const TenModel = mongoose.model('Ten', tenSchema)

module.exports = TenModel
