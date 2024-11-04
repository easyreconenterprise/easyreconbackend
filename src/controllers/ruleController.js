const RuleModel = require('../models/ruleModel')

// exports.saveRule = async (req, res) => {
//     const {
//         allowUSID,
//         ledgerKeyword,
//         statementKeyword,
//         order,
//         statementSequence,
//         switchId,
//         uploadSessionIds, // Now accepting an array of session IDs
//         ledgerSequence,
//     } = req.body

//     console.log('Request Body:', req.body)

//     try {
//         // Fetch existing rule by switchId
//         let rule = await RuleModel.findOne({ switchId })

//         if (!rule) {
//             // If no rule exists, create a new one
//             rule = new RuleModel({
//                 uploadSessionIds, // Add the array of session IDs
//                 switchId,
//                 allowUSID,
//                 ledgerKeyword,
//                 statementKeyword,
//                 order,
//                 statementSequence,
//                 ledgerSequence,
//             })
//         } else {
//             // If rule exists, update it
//             rule.allowUSID = allowUSID
//             rule.ledgerKeyword = ledgerKeyword
//             rule.statementKeyword = statementKeyword
//             rule.order = order
//             rule.statementSequence = statementSequence
//             rule.ledgerSequence = ledgerSequence

//             // Update the uploadSessionIds array
//             if (Array.isArray(uploadSessionIds)) {
//                 // Add the new session IDs to the existing ones, ensuring no duplicates
//                 rule.uploadSessionIds = [
//                     ...new Set([...rule.uploadSessionIds, ...uploadSessionIds]),
//                 ]
//             }
//         }

//         await rule.save()
//         return res.status(200).json({ success: true, data: rule })
//     } catch (error) {
//         console.error('Error saving rule:', error)
//         return res.status(500).json({ success: false, error: 'Server Error' })
//     }
// }
exports.saveRule = async (req, res) => {
    const {
        allowUSID,
        ledgerKeyword,
        statementKeyword,
        order,
        statementSequence,
        switchId,
        uploadSessionIds, // Now accepting an array of session IDs
        ledgerSequence,
    } = req.body

    console.log('Request Body:', req.body)

    try {
        // Create a new rule regardless of whether one already exists
        const newRule = new RuleModel({
            uploadSessionIds, // Add the array of session IDs
            switchId,
            allowUSID,
            ledgerKeyword,
            statementKeyword,
            order,
            statementSequence,
            ledgerSequence,
        })

        // Save the new rule to the database
        await newRule.save()
        return res.status(200).json({ success: true, data: newRule })
    } catch (error) {
        console.error('Error saving rule:', error)
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}

// Get all rules for the authenticated user, session, and switch
exports.getRules = async (req, res) => {
    const { uploadSessionId, switchId } = req.params
    const userId = req.user.id // Assuming authentication middleware is used

    try {
        const rules = await RuleModel.find({
            userId,
            uploadSessionId,
            switchId,
        })

        if (!rules || rules.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: 'No rules found' })
        }

        return res.status(200).json({ success: true, data: rules })
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}

exports.getLastRule = async (req, res) => {
    try {
        const lastRule = await RuleModel.findOne().sort({ createdAt: -1 }) // Sort by createdAt in descending order
        if (!lastRule) {
            return res
                .status(404)
                .json({ success: false, message: 'No rules found' })
        }
        return res.status(200).json({ success: true, data: lastRule })
    } catch (error) {
        console.error('Error fetching last rule:', error)
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}
