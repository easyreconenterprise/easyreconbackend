const mongoose = require('mongoose')

// Define an array of content fields
const contentFields = [
    'content1',
    'content2',
    'content3',
    'content4',
    'content5',
    'content6',
    'content7',
    'content8',
    'content9',
    'content10',
    'content11',
    'content12',
    'content13',
    'content14',
    'content15',
    'content16',
    'content17',
    'content18',
    'content19',
    'content20',
]

// Create an object with content fields and their types
const contentFieldsDefinition = contentFields.reduce((fields, field) => {
    fields[field] = String
    return fields
}, {})

const fourSchema = new mongoose.Schema(
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

const FourModel = mongoose.model('Four', fourSchema)

module.exports = FourModel
