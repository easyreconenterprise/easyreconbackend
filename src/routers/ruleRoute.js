const express = require('express')

const authenticateUser = require('../middlewares/authenticateUser')
const {
    saveRule,
    getRules,
    getLastRule,
} = require('../controllers/ruleController')

const router = express.Router()

// Save or update a rule
router.post('/rule', authenticateUser, saveRule)

// Get all rules
router.get('/rules', authenticateUser, getRules)

router.get('/rules/last', authenticateUser, getLastRule)

module.exports = router
