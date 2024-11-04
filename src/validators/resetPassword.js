const joi = require('@hapi/joi')

const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema.validate(req.body)

        if (result.error) {
            return res.status(400).json({ message: result.error.message })
        }

        next()
    }
}

const resetSchema = joi.object().keys({
    email: joi
        .string()
        .trim()
        .required()
        .lowercase()
        .error(new Error('email is required!')),
    oldPassword: joi
        .string()
        .required()
        .lowercase()
        .error(new Error('Please Provide old password!')),
    newPassword: joi
        .string()
        .required()
        .error(new Error('Please provide new Password!')),

})

// const loginSchema = joi.object().keys({
//     email: joi
//         .string()
//         .email()
//         .trim()
//         .required()
//         .error(new Error('Provide valid email address')),
//     password: joi
//         .string()
//         .min(8)
//         .trim()
//         .required()
//         .error(new Error('Password must be at least 8 characters')),
// })

const resetDto = validateBody(resetSchema)

module.exports = { resetDto }
