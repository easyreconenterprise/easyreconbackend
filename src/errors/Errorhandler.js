const CONFIG = require('../../config/env')
const { AppError } = require('./AppError')
const { logger } = require('../utils/logger')

/*Defined error*/
const prodValidationError = (err) => {
    return new AppError(err.message, 400)
}

const handleTypeError = (err) => {
    return new AppError(err.message, 400)
}

/*Defined Error 1*/
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDb = (err) => {
    const value = err.keyValue.username
        ? JSON.stringify(err.keyValue.username)
        : JSON.stringify(err.keyValue.email)
    const message = `Username < ${value} > already exists, Please use another value!`
    return new AppError(message, 400)
}

/*Development error handler*/
const devHandler = (err, req, res, next) => {
    console.log(err)
    const statusCode = err.statusCode || 500
    const status = err.status || 'error'
    res.status(statusCode).json({
        status: status,
        message: err.message,
    })
}

/*Production error handler*/
var prodHandler = (err, req, res, next) => {
    /*Defined Errors*/
    if (err.name === 'ValidationError') {
        err = prodValidationError(err)
    }
    if (err.name === 'CastError') {
        err = handleCastErrorDB(err)
    }
    if (err.code === 11000) {
        err = handleDuplicateFieldsDb(err)
    }

    if (err.name === 'TypeError') {
        err = handleTypeError(err)
    }

    /*Response Handler for defined errors*/
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {
        console.log(err)
        logger.error(err)
        return res.status(500).json({
            status: 'error',
            message: 'Server Issues!',
        })
    }
}

module.exports = CONFIG.NODE_ENV === 'development' ? devHandler : prodHandler
