const mongoose = require('mongoose')

// Define an array of content fields
const contentFields = [
    'content16',
    'content17',
    'content18',
    'content4',
    'content5',
    'content56',
    'content57',
    'content58',
    'content59',
    'content60',
]

// Create an object with content fields and their types
const contentFieldsDefinition = contentFields.reduce((fields, field) => {
    fields[field] = String
    return fields
}, {})

const nineSchema = new mongoose.Schema(
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

const NineModel = mongoose.model('Nine', nineSchema)

module.exports = NineModel
