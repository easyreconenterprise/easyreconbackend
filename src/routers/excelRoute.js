const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3')

const multerS3 = require('multer-s3')
const fs = require('fs')
const dotenv = require('dotenv')
const dataController = require('../controllers/dataController') // Import the data controller
const CategorizedDataModel = require('../models/CategorizedDataModel') // Import your categorized data model
const authenticateUser = require('../middlewares/authenticateUser')
const TextModel = require('../models/TextModel')
dotenv.config()
// const upload = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             cb(null, path.join(__dirname, '../uploads')) // Resolve the absolute path
//             // cb(null, '/tmp')
//         },
//         filename: (req, file, cb) => {
//             cb(null, Date.now() + '-' + file.originalname)
//         },
//     }),
// })
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, process.env.UPLOAD_DIR || './uploads') // Use environment variable or default path
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname) // Unique filename
//     },
// })

// const upload = multer({ storage: storage })

// Initialize S3 with AWS SDK v2
// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: 'us-east-1', // Adjust this to your desired region
// })
// const s3 = new AWS.S3()

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: 'edupros',
//         acl: 'private',
//         metadata: (req, file, cb) => {
//             cb(null, { fieldName: file.fieldname })
//         },
//         key: (req, file, cb) => {
//             cb(null, `${Date.now()}-${file.originalname}`)
//         },
//     }),
// })
// Ensure AWS credentials are set through environment variables
// const s3 = new S3Client({
//     region: 'us-east-1',
//     endpoint: 'https://s3.us-east-1.amazonaws.com',
//     forcePathStyle: true, // Force path-style bucket addressing
//     credentials: {
//         accessKeyId: 'YOUR_ACCESS_KEY',
//         secretAccessKey: 'YOUR_SECRET_KEY',
//     },
// })

// // Ensure the S3 bucket name is set
// const bucketName = process.env.AWS_BUCKET_NAME

// const storage = multerS3({
//     s3: s3,
//     bucket: bucketName, // Ensure bucket name is set
//     acl: 'private',
//     metadata: (req, file, cb) => {
//         cb(null, { fieldName: file.fieldname })
//     },
//     key: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`)
//     },
// })

// const upload = multer({ storage })

// Multer Setup for S3

// S3 Client Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: {
        retryStrategy: {
            retryDelayOptions: {
                base: 100,
            },
            maxRetries: 5,
        },
        timeout: 60000, // Set a longer timeout (e.g., 60 seconds)
    },
})

console.log('S3 Client:', s3)

// Multer Storage Configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'eduprosolution',
        acl: 'private', // Access control
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatic content type
        key: (req, file, cb) => {
            const fileKey = `${Date.now()}-${file.originalname}`
            cb(null, fileKey)
        },
    }),
})

const states = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath =
                process.env.UPLOAD_DIR_STATEMENT || '/tmp/statement'
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true }) // Ensure directory exists
            }
            cb(null, uploadPath)
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname)
        },
    }),
})
// const states = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             // cb(null, path.join(__dirname, '../statement')) // Resolve the absolute path
//             cb(null, '/tmp/statement')
//         },
//         filename: (req, file, cb) => {
//             cb(null, Date.now() + '-' + file.originalname)
//         },
//     }),
// })

// const states = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             const uploadPath = '/tmp/statement'
//             if (!fs.existsSync(uploadPath)) {
//                 fs.mkdirSync(uploadPath, { recursive: true }) // Ensure directory exists
//             }
//             cb(null, uploadPath)
//         },
//         filename: (req, file, cb) => {
//             cb(null, Date.now() + '-' + file.originalname)
//         },
//     }),
// })

// Upload route

// router.post(
//     '/upload',
//     authenticateUser,
//     upload.single('csvFile'),
//     dataController.uploadFile
// )
// router.post('/upload', authenticateUser, upload.single('csvFile'), (req, res) =>
//     dataController.uploadFile(req, res, s3)
// )

router.post(
    '/upload',
    authenticateUser,
    upload.single('csvFile'),
    dataController.uploadFile
)
router.post(
    '/remove-uploaded-file',
    authenticateUser, // Ensure authentication middleware is applied
    dataController.removeUploadedFile
)

router.post(
    '/upload/statement',
    authenticateUser,
    upload.single('stmFile'),
    dataController.statementFile
)

// router.post(
//     '/upload/statement',
//     authenticateUser,
//     states.single('stmFile'),
//     dataController.statementFile
// )

// router.post("/account-setting", upload.single("schoolLogo"), (req, res) => {
//     createAccount(req, res, s3);
//   });

router.post('/affiliate', authenticateUser, dataController.createAffiliate)
router.post('/domain', authenticateUser, dataController.createDomain)
router.post('/account', authenticateUser, dataController.createAccount)
router.post('/switch', authenticateUser, dataController.createSwitch)

router.get(
    '/check-data-exists',
    authenticateUser,
    dataController.checkDataExistsInDatabase
)
router.get(
    '/check-statement-exists',
    authenticateUser,
    dataController.checkStatementExistsInDatabase
)
// Data retrieval route
router.get('/data', authenticateUser, dataController.getData)
router.get('/statement', authenticateUser, dataController.getStatement)

router.get(
    '/statement-switch',
    authenticateUser,
    dataController.getStatementSwitch
)

// router.get('/statements/:id', dataController.getStatementById)
// Route to get statement by switch ID
router.get(
    '/statements/:switchId',
    authenticateUser,
    dataController.getStatementsBySwitchId
)

router.get(
    '/ledger/:switchId',
    authenticateUser,
    dataController.getLedgerBySwitchId
)
router.get(
    '/all-ledger/:switchId',
    authenticateUser,
    dataController.getAllLedgerBySwitchId
)
router.get(
    '/all-statements/:switchId',
    authenticateUser,
    dataController.getAllStatementsBySwitchId
)
router.get(
    '/laststatement',
    authenticateUser,
    dataController.getLastStatementDate
)

router.get('/lastledger', authenticateUser, dataController.getLastLedgerDate)

router.get(
    '/account/:accountId',
    authenticateUser,
    dataController.getAccountById
)

router.get('/affiliates', authenticateUser, dataController.getAffiliates)

// Get domains for a specific affiliate
router.get('/domains/:affiliateId', authenticateUser, dataController.getDomains)

// Get accounts for a specific domain
router.get('/accounts/:domainId', authenticateUser, dataController.getAccounts)

// Switch session
router.post('/switch-session', authenticateUser, dataController.switchSession)

router.get('/data/:id', authenticateUser, dataController.getDataById)

router.delete('/data/:id', authenticateUser, dataController.deleteData) // Use the route with a base URL

// router.get('/mapped-data', authenticateUser, async (req, res) => {
//     try {
//         const mappedData = await CategorizedDataModel.find()
//         res.json(mappedData)
//     } catch (error) {
//         res.status(500).json({ error: 'Could not fetch mapped data' })
//     }
// })

router.get('/mapped-data', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id // Get the authenticated user's ID

        // Fetch mapped data for the specific user
        const mappedData = await CategorizedDataModel.find({ userId: userId })
        res.json(mappedData)
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch mapped data' })
    }
})

router.post('/update-mapped-data', authenticateUser, async (req, res) => {
    try {
        const { category, subcategory } = req.body

        // Get the authenticated user's ID
        const userId = req.user.id // Assuming you've set the user ID in the authentication middleware

        console.log('Received request body:', req.body)

        if (!subcategory) {
            throw new Error('Subcategory data is missing.')
        }

        // Construct the update operation to include user ID
        const updateOperation = {
            $set: {
                subcategory: subcategory,
                userId: userId, // Store the user ID in the categorized data
            },
        }

        // Find and update the categorized data for the specific user
        const savedData = await CategorizedDataModel.findOneAndUpdate(
            { userId: userId }, // Filter by user ID
            updateOperation,
            {
                upsert: true,
                new: true,
            }
        )

        console.log('Saved data:', savedData)

        res.status(201).json(savedData)
    } catch (error) {
        console.error('Error while saving data:', error)
        res.status(500).json({ error: 'An error occurred while saving data.' })
    }
})
// Delete route for mapped data
router.delete('/delete-mapped-data/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id // Assuming you've set the user ID in the authentication middleware
        const mappedDataId = req.params.id // Get the mapped data ID from the request params

        // Find and delete the mapped data by ID and user ID
        const deletedData = await CategorizedDataModel.findOneAndRemove({
            _id: mappedDataId,
            userId: userId,
        })

        if (!deletedData) {
            return res.status(404).json({ error: 'Mapped data not found.' })
        }

        res.status(200).json({ message: 'Mapped data deleted successfully.' })
    } catch (error) {
        console.error('Error while deleting mapped data:', error)
        res.status(500).json({
            error: 'An error occurred while deleting mapped data.',
        })
    }
})

module.exports = router
// Assuming you have an API endpoint for getting categorized data
