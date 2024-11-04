const mongoose = require('mongoose')

// Define an array of content fields
const contentFields = [
    'content16',
    'content17',
    'content18',
    'content19',
    'content20',
    'content2',
    'content1',
    'content3',
    'content4',
    'content8',
    'content9',
    'content10',
    'content11',
    'content12',
    'content13',
    'content14',
    'content15',
    'content21',
    'content22',
    'content23',
    'content24',
    'content25',
    'content26',
    'content27',
    'content28',
    'content29',
    'content30',
    'content31',
    'content32',
    'content33',
    'content34',
    'content35',
    'content36',
    'content37',
    'content38',
    'content39',
    'content40',
    'content41',
    'content50',
    'content51',
    'content52',
    'content53',
    'content54',
    'content55',
    'content56',
    'content57',
    'content58',
    'content59',
    'content60',
    'content61',
    'content62',
    'content63',
    'content64',
]

// Create an object with content fields and their types
const contentFieldsDefinition = contentFields.reduce((fields, field) => {
    fields[field] = String
    return fields
}, {})

const twentySchema = new mongoose.Schema(
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

const TwentyModel = mongoose.model('Twenty', twentySchema)

module.exports = TwentyModel
