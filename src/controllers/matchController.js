const MatchModel = require('../models/MatchModel')
const mongoose = require('mongoose')
exports.saveMatchedItems = async (req, res) => {
    const {
        accountId,
        switchId,
        exactMatches = [],
        probableMatches = [],
        similarDetailsMatches = [],
        matchedStatements = [],
        unmatchedItems = [], // Expecting unmatchedItems directly from the request body
        uploadSessionId,
    } = req.body

    // Log received data for debugging
    console.log('Received exactMatches count:', exactMatches.length)
    console.log('Request Body:', req.body)

    try {
        // Find an existing match document based on accountId, switchId, and uploadSessionId
        let match = await MatchModel.findOne({
            accountId,
            switchId,
            uploadSessionId,
        })

        if (!match) {
            // If no existing match, create a new match document
            match = new MatchModel({
                accountId,
                switchId,
                exactMatches: [...exactMatches], // Save the first batch of exact matches
                similarDetailsMatches: [...similarDetailsMatches], // Save the first batch of exact matches
                probableMatches, // Save the first batch of probable matches
                matchedStatements, // Save the first batch of matched statements
                unmatchedItems, // Use the unmatchedItems from the request body
                uploadSessionId,
            })
        } else {
            // If match document exists, update existing data

            // Prevent duplicating exact matches
            const existingExactIds = new Set(
                match.exactMatches.map((existingMatch) => existingMatch.USID)
            )
            exactMatches.forEach((newMatch) => {
                if (!existingExactIds.has(newMatch.USID)) {
                    match.exactMatches.push(newMatch)
                }
            })
            const existingSimilarDetailsIds = new Set(
                match.similarDetailsMatches.map(
                    (existingSimilarDetails) => existingSimilarDetails.USID
                )
            )
            similarDetailsMatches.forEach((newsimilarDetailsMatch) => {
                if (
                    !existingSimilarDetailsIds.has(newsimilarDetailsMatch.USID)
                ) {
                    match.similarDetailsMatches.push(newsimilarDetailsMatch)
                }
            })

            // Append new probable matches if they don't already exist
            const existingProbableIds = new Set(
                match.probableMatches.map(
                    (existingProbable) => existingProbable.USID
                )
            )
            probableMatches.forEach((newProbableMatch) => {
                if (!existingProbableIds.has(newProbableMatch.USID)) {
                    match.probableMatches.push(newProbableMatch)
                }
            })

            // Only update matched statements if they are provided
            if (matchedStatements.length > 0) {
                match.matchedStatements = matchedStatements
            }

            // Reset unmatchedItems to the latest ones provided in the request
            match.unmatchedItems = unmatchedItems // Resetting to the latest unmatched items
        }
        console.log('Unmatched Items:', unmatchedItems)

        // Save the updated match document
        await match.save()

        console.log('Match saved successfully:', match)
        return res.status(200).json({ success: true, data: match })
    } catch (error) {
        console.error('Error saving match:', error)
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}

// exports.getMatchedItems = async (req, res) => {
//     const { switchId } = req.params

//     try {
//         // Find the match document by switchId
//         const match = await MatchModel.findOne({ switchId })

//         if (!match) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: 'No matches found' })
//         }

//         // Return the entire match document as a response
//         return res.status(200).json({ success: true, data: match })
//     } catch (error) {
//         return res.status(500).json({ success: false, error: 'Server Error' })
//     }
// }

exports.getMatchedItems = async (req, res) => {
    const { switchId } = req.params
    const { type } = req.query // Get type from query params

    try {
        // Find the match document by switchId
        const match = await MatchModel.findOne({ switchId })

        if (!match) {
            return res
                .status(404)
                .json({ success: false, message: 'No matches found' })
        }

        let responseData

        // Filter unmatched items if type is provided
        if (type === 'unmatched') {
            responseData = match.unmatchedItems // Return unmatched items
        } else {
            responseData = match // Return full match document
        }

        return res.status(200).json({ success: true, data: responseData })
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}
exports.getLastUploadedMatchedItemsForSwitch = async (req, res) => {
    const { switchId } = req.params

    try {
        // Find the latest upload session for the given switch
        const latestUploadSession = await MatchModel.findOne({ switchId })
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .limit(1) // Limit to the latest document only

        if (!latestUploadSession) {
            return res.status(404).json({
                success: false,
                message: `No matches found for switch ${switchId}`,
            })
        }

        const { uploadSessionId } = latestUploadSession

        // Find the match document by latest uploadSessionId and switchId
        const match = await MatchModel.findOne({ uploadSessionId, switchId })

        if (!match) {
            return res.status(404).json({
                success: false,
                message: `No matches found for the latest upload session of switch ${switchId}`,
            })
        }

        return res.status(200).json({ success: true, data: match })
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server Error' })
    }
}
// Controller function
exports.getLastUploadedUnmatchedItemsForSwitch = async (req, res) => {
    const { switchId } = req.params

    try {
        // Find the latest upload session for the given switchId
        const latestUploadSession = await MatchModel.findOne({ switchId })
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .limit(1) // Get the most recent document

        if (!latestUploadSession) {
            return res.status(404).json({
                success: false,
                message: `No unmatched items found for switch ${switchId}`,
            })
        }

        const { unmatchedItems } = latestUploadSession

        // Check if unmatchedItems exist
        if (!unmatchedItems || unmatchedItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No unmatched items found for the latest upload session of switch ${switchId}`,
            })
        }

        // Return the unmatchedItems
        return res.status(200).json({ success: true, data: unmatchedItems })
    } catch (error) {
        console.error('Error fetching unmatched items:', error)
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        })
    }
}

exports.getTotalMatchedLedgerItems = async (req, res) => {
    const { switchId } = req.params

    try {
        // Aggregate to sum up the total exactMatches count for the given switchId
        const result = await MatchModel.aggregate([
            { $match: { switchId: mongoose.Types.ObjectId(switchId) } },
            {
                $group: {
                    _id: null,
                    totalMatched: { $sum: { $size: '$exactMatches' } },
                },
            },
        ])

        // Extract totalMatched or default to 0
        const totalMatched = result.length > 0 ? result[0].totalMatched : 0

        return res.status(200).json({
            success: true,
            data: {
                accountInfo: 'Total Record Matched(Ledger)',
                count: totalMatched,
            },
        })
    } catch (error) {
        console.error('Error fetching total matched ledger items:', error)
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        })
    }
}

exports.getTotalMatchedStatements = async (req, res) => {
    const { switchId } = req.params

    try {
        // Aggregate to sum up the total matchedStatements count for the given switchId
        const result = await MatchModel.aggregate([
            { $match: { switchId: mongoose.Types.ObjectId(switchId) } },
            {
                $group: {
                    _id: null,
                    totalMatched: { $sum: { $size: '$matchedStatements' } }, // Adjust field name
                },
            },
        ])

        // Extract totalMatched or default to 0
        const totalMatched = result.length > 0 ? result[0].totalMatched : 0

        return res.status(200).json({
            success: true,
            data: {
                accountInfo: 'Total Record Matched(Statements)',
                count: totalMatched,
            },
        })
    } catch (error) {
        console.error('Error fetching total matched statements:', error)
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        })
    }
}

exports.getTotalUnmatchedLedgerItems = async (req, res) => {
    const { switchId } = req.params

    try {
        // Query to filter unmatchedItems by type 'ledger' and the given switchId
        const result = await MatchModel.aggregate([
            { $match: { switchId: mongoose.Types.ObjectId(switchId) } },
            {
                $project: {
                    unmatchedItems: {
                        $filter: {
                            input: '$unmatchedItems',
                            as: 'item',
                            cond: { $eq: ['$$item.type', 'ledger'] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    totalUnmatched: { $size: '$unmatchedItems' },
                },
            },
        ])

        // Extract totalUnmatched or default to 0
        const totalUnmatched = result.length > 0 ? result[0].totalUnmatched : 0

        return res.status(200).json({
            success: true,
            data: {
                accountInfo: 'Total Unmatched Items(Ledger)',
                count: totalUnmatched,
            },
        })
    } catch (error) {
        console.error('Error fetching total unmatched ledger items:', error)
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        })
    }
}

exports.getTotalUnmatchedStatementItems = async (req, res) => {
    const { switchId } = req.params

    try {
        // Query to filter unmatchedItems by type 'statement' and the given switchId
        const result = await MatchModel.aggregate([
            { $match: { switchId: mongoose.Types.ObjectId(switchId) } },
            {
                $project: {
                    unmatchedItems: {
                        $filter: {
                            input: '$unmatchedItems',
                            as: 'item',
                            cond: { $eq: ['$$item.type', 'statement'] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    totalUnmatched: { $size: '$unmatchedItems' },
                },
            },
        ])

        // Extract totalUnmatched or default to 0
        const totalUnmatched = result.length > 0 ? result[0].totalUnmatched : 0

        return res.status(200).json({
            success: true,
            data: {
                accountInfo: 'Total Unmatched Items(Statement)',
                count: totalUnmatched,
            },
        })
    } catch (error) {
        console.error('Error fetching total unmatched statement items:', error)
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        })
    }
}
