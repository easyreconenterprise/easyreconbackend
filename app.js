const express = require('express')
const authRoute = require('./src/routers/authRoute')
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

mongoose
    .connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB connected'))
    .catch((err) => console.log(err))

const corsOptions = {
    origin: ['https://easyrecon.vercel.app', 'http://localhost:3002'], // specify your client's URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions)) // Use this line to apply your CORS settings

app.use('/api/auth', authRoute)
app.use('/api/', excelRoute)
app.use('/api/', matchRoute)
app.use('/api/', ruleRoute)

/* Error handler Middlewares */
// app.use('*', unknownEndpoint)
// app.use(globalErrorhandler)

const PORT = process.env.PORT || 7000

app.listen(PORT, () => {
    console.log('backend server is running')
})
