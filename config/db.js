const mongoose = require('mongoose')
const { logger } = require('../src/utils/logger')


module.exports = ( URI ) => {
    mongoose.set('strictQuery', false)
    mongoose
        .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            logger.info('Connection to MongoDB successful')
        })
        .catch((err) => {
            logger.error('Connection to MongoDB failed', err.message)
        })
} 
