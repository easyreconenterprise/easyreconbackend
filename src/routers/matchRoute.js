const express = require('express')
const {
    saveMatchedItems,
    getMatchedItems,
    getLastUploadedMatchedItemsForSwitch,
} = require('../controllers/matchController')

const router = express.Router()

// Save matched items
router.post('/matches', saveMatchedItems)

// Get matched items by switchId
router.get('/matches/:switchId', getMatchedItems)
router.get(
    '/matches/last-uploaded/:switchId',
    getLastUploadedMatchedItemsForSwitch
)

module.exports = router
