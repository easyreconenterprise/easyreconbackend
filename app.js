const express = require('express')
const authRoute = require('./src/routers/authRoute')
const userAccess = require('./src/routers/userAccess')
const { S3 } = require('@aws-sdk/client-s3')
const excelRoute = require('./src/routers/excelRoute')
const matchRoute = require('./src/routers/matchRoute')
const ruleRoute = require('./src/routers/ruleRoute')
const CONFIG = require('./config/env')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const cors = require('cors')
// require('./config/db')(CONFIG.DBURL)

dotenv.config()
const app = express()
app.use(express.json({ limit: '20mb' })) // Increase limit to 20mb
app.use(express.urlencoded({ limit: '20mb', extended: true })) // Increase limit to 20mb

console.log('new AWS Access Key:', process.env.AWS_ACCESS_KEY_ID)
console.log('new AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY)
console.log('new AWS Region:', process.env.AWS_REGION)
console.log('new AWS Bucket Name:', process.env.AWS_BUCKET_NAME)

// mongoose
//     .connect(process.env.DB_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,

//         connectTimeoutMS: 15000,
//         serverSelectionTimeoutMS: 30000,
//         socketTimeoutMS: 120000,

//         // bufferTimeoutMS: 30000,
//     })
//     .then(() => console.log('DB connected'))
//     .catch((err) => console.log(err))

mongoose
    .connect(process.env.DB_URL, {
        useNewUrlParser: true, // Parse the connection string correctly
        useUnifiedTopology: true, // Use the new topology engine to avoid warnings

        connectTimeoutMS: 15000, // Timeout for initial connection (in ms)
        serverSelectionTimeoutMS: 30000, // Timeout for finding a server (in ms)
        socketTimeoutMS: 120000, // Timeout for socket inactivity (in ms)

        // bufferMaxEntries: 0, // Optional: Prevents Mongoose from buffering queries when disconnected
    })
    .then(() => console.log('DB connected successfully'))
    .catch((err) => {
        console.error('DB connection error:', err)
    })

const corsOptions = {
    origin: ['https://easyrecon.vercel.app', 'http://localhost:3001'], // specify your client's URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`)
    next()
})

app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(r.route.path)
    }
})
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(
            `[${Object.keys(r.route.methods).join(',').toUpperCase()}] ${
                r.route.path
            }`
        )
    }
})
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`)
    next()
})

app.use(cors(corsOptions)) // Use this line to apply your CORS settings

app.use('/api/auth', authRoute)
app.use('/api/', userAccess)
app.use('/api/', excelRoute)
app.use('/api/', matchRoute)
app.use('/api/', ruleRoute)
app.post('/api/manual-entry-led', (req, res) => {
    res.json({ message: 'Manual entry endpoint hit' })
})

/* Error handler Middlewares */
// app.use('*', unknownEndpoint)
// app.use(globalErrorhandler)

const PORT = process.env.PORT || 7000

app.listen(PORT, () => {
    console.log('backend server is running')
})
