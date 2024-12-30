const express = require('express')
const {
    saveMatchedItems,
    getMatchedItems,
    getLastUploadedMatchedItemsForSwitch,
    getLastUploadedUnmatchedItemsForSwitch,
    getTotalMatchedLedgerItems,
    getTotalMatchedStatements,
    getTotalUnmatchedLedgerItems,
    getTotalUnmatchedStatementItems,
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
router.get(
    '/matches/total-matched-ledger/:switchId',
    authenticateUser,
    getTotalMatchedLedgerItems
)

router.get(
    '/matches/total-matched-statements/:switchId',
    authenticateUser,
    getTotalMatchedStatements
)

router.get(
    '/matches/total-unmatched-ledger/:switchId',
    authenticateUser,
    getTotalUnmatchedLedgerItems
)

router.get(
    '/matches/total-unmatched-statement/:switchId',
    authenticateUser,
    getTotalUnmatchedStatementItems
)
module.exports = router
