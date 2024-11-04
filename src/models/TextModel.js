const mongoose = require('mongoose')

const contentFields = [
    'content1',
    'content2',
    'content3',
    'content4',
    'content5',
    'content6',
    'content7',
    'content70',
    'content71',
    'content72',
    'content73',
    'content74',
    'content75',
    'content76',
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
]

const contentFieldsDefinition = contentFields.reduce((fields, field) => {
    fields[field] = String
    return fields
}, {})

const textSchema = new mongoose.Schema(
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

const TextModel = mongoose.model('Text', textSchema)

module.exports = TextModel
