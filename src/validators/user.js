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

const signupSchema = joi.object().keys({
    fullname: joi
        .string()
        .trim()
        .required()
        .lowercase()
        .error(new Error('Fullname is required!')),
    username: joi
        .string()
        .trim()
        .required()
        .lowercase()
        .error(new Error('Username is required!')),
    email: joi
        .string()
        .email()
        .trim()
        .required()
        .error(new Error('Provide a valid email address!')),
    password: joi
        .string()
        .required()
        .label('password')
        .error(new Error('Password is required!')),

    confirmPassword: joi
      .string()
      .valid(joi.ref('password'))
      .required()
      .label('confirmPassword')
      .error(new Error('ConfirmPassword must match password'))
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

const signupDto = validateBody(signupSchema)

module.exports = { signupDto }
