const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const dataController = require('../controllers/dataController') // Import the data controller
const CategorizedDataModel = require('../models/CategorizedDataModel') // Import your categorized data model
const authenticateUser = require('../middlewares/authenticateUser')
const TextModel = require('../models/TextModel')
const CashModel = require('../models/CashModel')

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../uploads')) // Resolve the absolute path
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
router.get(
    '/check-data-exists',
    authenticateUser,
    dataController.checkDataExistsInDatabase
)
// Data retrieval route
router.get('/data', authenticateUser, dataController.getData)

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

// router.post('/update-mapped-data', authenticateUser, async (req, res) => {
//     try {
//         const { category, subcategory } = req.body

//         console.log('Received request body:', req.body)

//         if (!subcategory) {
//             throw new Error('Subcategory data is missing.')
//         }

//         const updateOperation = {
//             $set: {
//                 subcategory: subcategory,
//             },
//         }

//         const savedData = await CategorizedDataModel.findOneAndUpdate(
//             {},
//             updateOperation,
//             {
//                 upsert: true,
//                 new: true,
//             }
//         )

//         console.log('Saved data:', savedData)

//         res.status(201).json(savedData)
//     } catch (error) {
//         console.error('Error while saving data:', error)
//         res.status(500).json({ error: 'An error occurred while saving data.' })
//     }
// })

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

router.get('/get-saved-text', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id
        const savedText = await TextModel.findOne({ userId })
        res.json(savedText)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching saved text.' })
    }
})

router.post('/save-text', authenticateUser, async (req, res) => {
    const userId = req.user.id
    const {
        content1,
        content2,
        content3,
        content4,
        content5,
        content6,
        content7,
        content8,
        content9,
        content10,
        content11,
        content12,
    } = req.body

    try {
        // Find and update the text for the current user
        const savedText = await TextModel.findOneAndUpdate(
            { userId },
            {
                content1,
                content2,
                content3,
                content4,
                content5,
                content6,
                content7,
                content8,
                content9,
                content10,
                content11,
                content12,
            }, // Use field names 'content1' and 'content2' for each text area
            { upsert: true, new: true }
        )

        res.status(201).json(savedText)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error saving text.' })
    }
})
router.post('/save-cash-text', authenticateUser, async (req, res) => {
    const userId = req.user.id

    // Define an array of content field names
    const contentFields = [
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
        'content42',
        'content43',
        'content44',
        'content45',
        'content46',
        'content47',
        'content48',
        'content49',
        'content50',
        'content61',
        'content62',
        'content63',
        'content64',
        'content65',
        'content66',
        'content87',
        'content108',
        'content109',
        'content89',
        'content90',
        'content91',
        'content92',
        'content93',
        'content94',
        'content95',
        'content96',
        // Add any other content fields here
    ]

    const updateFields = {}

    // Loop through content fields and assign values from the request body
    contentFields.forEach((field) => {
        if (req.body[field]) {
            updateFields[field] = req.body[field]
        }
    })

    try {
        // Find and update the text for the current user
        const savedText = await CashModel.findOneAndUpdate(
            { userId },
            updateFields,
            { upsert: true, new: true }
        )

        res.status(201).json(savedText)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error saving text.' })
    }
})

module.exports = router

module.exports = router
// Assuming you have an API endpoint for getting categorized data
