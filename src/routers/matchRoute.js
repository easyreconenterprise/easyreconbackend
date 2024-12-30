const express = require('express')
const {
    saveMatchedItems,
    getMatchedItems,
    getLastUploadedMatchedItemsForSwitch,
    getLastUploadedUnmatchedItemsForSwitch,
} = require('../controllers/matchController')
const authenticateUser = require('../middlewares/authenticateUser')

const router = express.Router()

// Save matched items
router.post('/matches', authenticateUser, saveMatchedItems)

// Get matched items by switchId
router.get('/matches/:switchId', authenticateUser, getMatchedItems)
router.get(
    '/matches/last-uploaded/:switchId',
    authenticateUser,
    getLastUploadedMatchedItemsForSwitch
)

router.get(
    '/unmatched/last-uploaded/:switchId',
    authenticateUser,
    getLastUploadedUnmatchedItemsForSwitch
)

module.exports = router
