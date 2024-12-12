const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const dataController = require('../controllers/dataController') // Import the data controller
const CategorizedDataModel = require('../models/CategorizedDataModel') // Import your categorized data model
const authenticateUser = require('../middlewares/authenticateUser')
const TextModel = require('../models/TextModel')

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // cb(null, path.join(__dirname, '../uploads')) // Resolve the absolute path
            cb(null, '/tmp')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname)
        },
    }),
})
const states = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // cb(null, path.join(__dirname, '../statement')) // Resolve the absolute path
            cb(null, '/tmp/statement')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname)
        },
    }),
})

// Upload route

router.post(
    '/upload',
    authenticateUser,
    upload.single('csvFile'),
    dataController.uploadFile
)
router.post(
    '/upload/statement',
    authenticateUser,
    states.single('stmFile'),
    dataController.statementFile
)

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
    '/laststatement',
    authenticateUser,
    dataController.getLastStatementDate
)

router.get('/lastledger/', authenticateUser, dataController.getLastLedgerDate)

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
