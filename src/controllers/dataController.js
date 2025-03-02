const path = require('path')
const fs = require('fs')
const fastCsv = require('fast-csv')
const Papa = require('papaparse')
const DataModel = require('../models/DataModel')
const authenticateUser = require('../middlewares/authenticateUser')
const StatementModel = require('../models/StatementModel')
const mongoose = require('mongoose')
const moment = require('moment') // Use moment.js for date manipulation (if not installed, run `npm install moment`)
const XLSX = require('xlsx')
const Affiliate = require('../models/affliateModel')
const { Readable } = require('stream')
const Domain = require('../models/domainModel')
const Account = require('../models/accountModel')
const Switch = require('../models/switchModel')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const dotenv = require('dotenv')
dotenv.config()

const s3 = new S3Client({
    region: process.env.AWS_REGION, // AWS Region from .env
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // AWS Access Key from .env
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // AWS Secret Key from .env
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

// exports.uploadFile = async (req, res) => {
//     try {
//         const file = req.file // Uploaded file
//         const userId = req.user.id // User ID
//         const switchId = req.body.switch // Switch ID from request body

//         if (!file) {
//             return res.status(400).json({ error: 'No file was uploaded.' })
//         }

//         // Fetch the switch to get the account ID
//         const switchData = await Switch.findById(switchId).populate('account')
//         if (!switchData) {
//             return res.status(404).json({ error: 'Switch not found.' })
//         }

//         const accountId = switchData.account._id // Get the account ID from the switch

//         // Generate a new upload session ID
//         const uploadSessionId = new mongoose.Types.ObjectId()

//         // Fetch the file from S3
//         const command = new GetObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: file.key,
//         })

//         const response = await s3.send(command) // Execute the command

//         // S3 body comes as a stream, so we need to process it
//         const s3FileStream = Readable.from(response.Body)

//         const chunks = []
//         s3FileStream.on('data', (chunk) => chunks.push(chunk))
//         s3FileStream.on('end', async () => {
//             const fileData = Buffer.concat(chunks)

//             let jsonData = []

//             // Define the CSV parsing function
//             const parseCSV = (data, keys) => {
//                 return new Promise((resolve, reject) => {
//                     Papa.parse(data, {
//                         header: true,
//                         dynamicTyping: true, // Ensure numeric values are parsed correctly
//                         skipEmptyLines: true, // Ignore empty lines
//                         complete: (results) => {
//                             const sanitizedData = results.data.map((row) => {
//                                 row[keys[3]] = parseFloat(
//                                     (row[keys[3]] || '0')
//                                         .toString()
//                                         .replace(/[^0-9.-]/g, '')
//                                 )
//                                 return row
//                             })
//                             resolve(
//                                 sanitizedData.filter((row) =>
//                                     Object.values(row).some(Boolean)
//                                 )
//                             )
//                         },
//                         error: (err) => reject(err),
//                     })
//                 })
//             }

//             // Determine file type and process accordingly
//             if (file.mimetype === 'text/csv') {
//                 console.log('Processing CSV file.')
//                 const csvData = fileData.toString('utf-8')

//                 // Parse the data once to extract keys
//                 const initialResults = Papa.parse(csvData, { header: true })
//                 const keys = Object.keys(initialResults.data[0]) // Extract keys from the header

//                 // Pass keys to parseCSV
//                 jsonData = await parseCSV(csvData, keys)
//             } else if (
//                 file.mimetype ===
//                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             ) {
//                 console.log('Processing XLSX file.')
//                 const workbook = XLSX.read(fileData, { type: 'buffer' })
//                 const sheetName = workbook.SheetNames[0]
//                 const sheet = workbook.Sheets[sheetName]
//                 jsonData = XLSX.utils.sheet_to_json(sheet)
//             } else {
//                 console.error('Unsupported file format:', file.mimetype)
//                 return res
//                     .status(400)
//                     .json({ error: 'Unsupported file format.' })
//             }

//             // Extracting keys dynamically
//             const keys = Object.keys(jsonData[0])

//             // Convert Excel dates if present
//             const convertExcelDate = (excelDate) => {
//                 const date = new Date((excelDate - 25569) * 86400 * 1000) // Excel stores dates starting from 1900
//                 return date.toLocaleDateString('en-GB', {
//                     year: '2-digit',
//                     month: 'short',
//                     day: '2-digit',
//                 })
//             }

//             const mappedData = jsonData.map((row) => ({
//                 PostDate: isNaN(row[keys[0]])
//                     ? row[keys[0]]
//                     : convertExcelDate(row[keys[0]]),
//                 ValDate: isNaN(row[keys[1]])
//                     ? row[keys[1]]
//                     : convertExcelDate(row[keys[1]]),
//                 Details: row[keys[2]],
//                 Debit:
//                     row[keys[3]] && row[keys[3]].toString().includes('-')
//                         ? Math.abs(row[keys[3]])
//                         : row[keys[3]] || 0,
//                 Credit: 0.0,
//                 USID: row[keys[4]] || '0.00',
//             }))

//             try {
//                 const totalDebit = mappedData.reduce(
//                     (sum, row) => sum + parseFloat(row.Debit || 0),
//                     0
//                 )
//                 console.log('Total Debit:', totalDebit, 'Total Credit:')

//                 const account = await Account.findById(accountId)
//                 if (!account) {
//                     return res.status(404).json({ error: 'Account not found.' })
//                 }

//                 const currentBalance = parseFloat(
//                     account.balanceAsPerLedger || 0
//                 )
//                 account.balanceAsPerLedger = (
//                     currentBalance + totalDebit
//                 ).toFixed(2)

//                 await account.save()

//                 await DataModel.insertMany(
//                     mappedData.map((row) => ({
//                         userId,
//                         switch: switchId,
//                         accountId,
//                         uploadSessionId,
//                         ...row,
//                     }))
//                 )

//                 return res.status(200).json({
//                     message: 'File uploaded and data saved to the database.',
//                     fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
//                     updatedBalance: account.balanceAsPerLedger,
//                     totalDebit,
//                 })
//             } catch (err) {
//                 console.error('Error saving data:', err)
//                 return res.status(500).json({ error: 'Error saving data.' })
//             }
//         })

//         s3FileStream.on('error', (err) => {
//             console.error('S3 File Stream Error:', err)
//             return res
//                 .status(500)
//                 .json({ error: 'Error processing file from S3.' })
//         })
//     } catch (err) {
//         console.error('Error uploading file:', err)
//         return res.status(500).json({ error: 'Internal server error.' })
//     }
// }

exports.uploadFile = async (req, res) => {
    try {
        const file = req.file // Uploaded file
        const userId = req.user.id // User ID
        const switchId = req.body.switch // Switch ID from request body

        if (!file) {
            return res.status(400).json({ error: 'No file was uploaded.' })
        }

        // Fetch the switch to get the account ID
        const switchData = await Switch.findById(switchId).populate('account')
        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }

        let accountId = switchData.account._id // Default to the account in the switch

        // Check if the account has a parent and use the parent account instead
        if (switchData.account.parentAccount) {
            accountId = switchData.account.parentAccount
        }

        // Generate a new upload session ID
        const uploadSessionId = new mongoose.Types.ObjectId()

        // Fetch the file from S3
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key,
        })

        const response = await s3.send(command) // Execute the command

        // S3 body comes as a stream, so we need to process it
        const s3FileStream = Readable.from(response.Body)

        const chunks = []
        s3FileStream.on('data', (chunk) => chunks.push(chunk))
        s3FileStream.on('end', async () => {
            const fileData = Buffer.concat(chunks)
            let jsonData = []

            // Define the CSV parsing function
            const parseCSV = (data, keys) => {
                return new Promise((resolve, reject) => {
                    Papa.parse(data, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            const sanitizedData = results.data.map((row) => {
                                row[keys[3]] = parseFloat(
                                    (row[keys[3]] || '0')
                                        .toString()
                                        .replace(/[^0-9.-]/g, '')
                                )
                                return row
                            })
                            resolve(
                                sanitizedData.filter((row) =>
                                    Object.values(row).some(Boolean)
                                )
                            )
                        },
                        error: (err) => reject(err),
                    })
                })
            }

            // Determine file type and process accordingly
            if (file.mimetype === 'text/csv') {
                console.log('Processing CSV file.')
                const csvData = fileData.toString('utf-8')

                // Parse the data once to extract keys
                const initialResults = Papa.parse(csvData, { header: true })
                const keys = Object.keys(initialResults.data[0]) // Extract keys from the header

                // Pass keys to parseCSV
                jsonData = await parseCSV(csvData, keys)
            } else if (
                file.mimetype ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ) {
                console.log('Processing XLSX file.')
                const workbook = XLSX.read(fileData, { type: 'buffer' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                jsonData = XLSX.utils.sheet_to_json(sheet)
            } else {
                console.error('Unsupported file format:', file.mimetype)
                return res
                    .status(400)
                    .json({ error: 'Unsupported file format.' })
            }

            // Extracting keys dynamically
            const keys = Object.keys(jsonData[0])

            // Convert Excel dates if present
            const convertExcelDate = (excelDate) => {
                const date = new Date((excelDate - 25569) * 86400 * 1000) // Excel stores dates starting from 1900
                return date.toLocaleDateString('en-GB', {
                    year: '2-digit',
                    month: 'short',
                    day: '2-digit',
                })
            }

            const mappedData = jsonData.map((row) => ({
                PostDate: isNaN(row[keys[0]])
                    ? row[keys[0]]
                    : convertExcelDate(row[keys[0]]),
                ValDate: isNaN(row[keys[1]])
                    ? row[keys[1]]
                    : convertExcelDate(row[keys[1]]),
                Details: row[keys[2]],
                Debit:
                    row[keys[3]] && row[keys[3]].toString().includes('-')
                        ? Math.abs(row[keys[3]])
                        : row[keys[3]] || 0,
                Credit: 0.0,
                USID: row[keys[4]] || '0.00',
            }))

            try {
                const totalDebit = mappedData.reduce(
                    (sum, row) => sum + parseFloat(row.Debit || 0),
                    0
                )
                console.log('Total Debit:', totalDebit)

                const account = await Account.findById(accountId)
                if (!account) {
                    return res.status(404).json({ error: 'Account not found.' })
                }

                const currentBalance = parseFloat(
                    account.balanceAsPerLedger || 0
                )
                account.balanceAsPerLedger = (
                    currentBalance + totalDebit
                ).toFixed(2)

                await account.save()

                await DataModel.insertMany(
                    mappedData.map((row) => ({
                        userId,
                        switch: switchId,
                        accountId,
                        uploadSessionId,
                        ...row,
                    }))
                )

                return res.status(200).json({
                    message: 'File uploaded and data saved to the database.',
                    fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
                    updatedBalance: account.balanceAsPerLedger,
                    totalDebit,
                })
            } catch (err) {
                console.error('Error saving data:', err)
                return res.status(500).json({ error: 'Error saving data.' })
            }
        })

        s3FileStream.on('error', (err) => {
            console.error('S3 File Stream Error:', err)
            return res
                .status(500)
                .json({ error: 'Error processing file from S3.' })
        })
    } catch (err) {
        console.error('Error uploading file:', err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

exports.manualEntry = async (req, res) => {
    console.log('manualEntry controller hit!')
    try {
        console.log('✅ Sending response now...')
        const { transactions, switchId } = req.body
        const userId = req.user.id // Ensure user is authenticated

        // Fetch the switch data
        const switchData = await Switch.findById(switchId)
        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }
        await switchData.populate('account')

        if (!switchData.account) {
            return res.status(400).json({
                error: 'No account associated with this switch. Please assign an account first.',
            })
        }

        const accountId = switchData.account._id

        // Get the month from the switch (Format: "YYYY-MM")
        const switchMonth = switchData.month

        // Convert switch month to a valid date range
        const startOfMonth = new Date(`${switchMonth}-01T00:00:00.000Z`)
        const endOfMonth = new Date(startOfMonth)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)

        // Find the child account for the selected month
        const childAccount = await Account.findOne({
            parentAccountId: accountId,
            balanceAsPerLedgerDate: {
                $gte: startOfMonth,
                $lt: endOfMonth,
            },
        })

        // Use the child account if it exists, otherwise use the parent
        const accountToUpdate = childAccount || switchData.account

        const uploadSessionId = new mongoose.Types.ObjectId() // Unique ID for this session

        // Format transactions for insertion
        const formattedData = transactions.map((row) => ({
            userId,
            switch: switchId,
            PostDate: row.PostDate,
            ValDate: row.ValDate,
            Details: row.Details,
            Debit: parseFloat(row.Debit) || 0,
            Credit: parseFloat(row.Credit) || 0,
            USID: row.USID,
            uploadSessionId,
            uploadedAt: new Date(),
        }))

        // Insert formatted transactions
        await DataModel.insertMany(formattedData)

        // Calculate total debit and update account balance
        const totalDebit = formattedData.reduce(
            (sum, row) => sum + parseFloat(row.Debit || 0),
            0
        )

        const currentBalance = parseFloat(
            accountToUpdate.balanceAsPerLedger || 0
        )
        accountToUpdate.balanceAsPerLedger = (
            currentBalance + totalDebit
        ).toFixed(2)

        await accountToUpdate.save() // Save updates

        res.status(201).json({
            message: 'Transactions successfully saved.',
            updatedBalance: accountToUpdate.balanceAsPerLedger,
            totalDebit,
        })
    } catch (error) {
        console.error('Error in manualEntry:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

exports.manualEntryStmt = async (req, res) => {
    try {
        const { transactions, switchId } = req.body
        const userId = req.user.id // Ensure user is authenticated
        // const switchData = await Switch.findById(switchId)
        // console.log('Raw Switch Data:', switchData)
        const switchData = await Switch.findById(switchId)
        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }
        await switchData.populate('account')

        // Find the switch and ensure it exists
        // const switchData = await Switch.findById(switchId).populate('account') // Populate the account
        // console.log('Switch Data:', switchData)

        // Ensure the switch has an associated account
        if (!switchData.account) {
            return res.status(400).json({
                error: 'No account associated with this switch. Please assign an account first.',
            })
        }

        const accountId = switchData.account._id // Get the account ID from the switch
        // Get the month from the switch (Format: "YYYY-MM")
        const switchMonth = switchData.month

        // Convert switch month to a valid date range
        const startOfMonth = new Date(`${switchMonth}-01T00:00:00.000Z`)
        const endOfMonth = new Date(startOfMonth)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)

        // Find the child account for the selected month
        const childAccount = await Account.findOne({
            parentAccountId: accountId,
            balanceAsPerStatementDate: {
                $gte: startOfMonth,
                $lt: endOfMonth,
            },
        })

        const accountToUpdate = childAccount || switchData.account

        const uploadSessionId = new mongoose.Types.ObjectId() // Unique ID for this session

        // Format transactions for insertion into Data model
        const formattedData = transactions.map((row) => ({
            userId,
            switch: switchId, // Only using switchId
            PostDate: row.PostDate,
            ValDate: row.ValDate,
            Details: row.Details,
            Debit: parseFloat(row.Debit) || 0,
            Credit: parseFloat(row.Credit) || 0,
            USID: row.USID,
            uploadSessionId,
            uploadedAt: new Date(),
        }))

        // Insert formatted transactions into Data model
        await StatementModel.insertMany(formattedData)

        // Calculate total debit and update account balance
        const totalCredit = formattedData.reduce(
            (sum, row) => sum + parseFloat(row.Credit || 0),
            0
        )

        // Fetch the account

        // Update the account balance
        const currentBalance = parseFloat(accountToUpdate.balanceAsPerStmt || 0)
        accountToUpdate.balanceAsPerStmt = (
            currentBalance + totalCredit
        ).toFixed(2)
        await accountToUpdate.save()

        res.status(201).json({
            message: 'Transactions successfully saved.',
            updatedBalance: accountToUpdate.balanceAsPerStmt,
            totalCredit,
        })
    } catch (error) {
        console.error('Error in manualEntry:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

exports.removeUploadedFile = async (req, res) => {
    try {
        const { switchId, startDate, endDate } = req.body

        // Validate input
        if (!switchId || !startDate) {
            return res
                .status(400)
                .json({ error: 'Switch ID and Start Date are required.' })
        }

        // Parse date strings
        const start = new Date(startDate)
        if (isNaN(start.getTime())) {
            return res
                .status(400)
                .json({ error: 'Invalid date format for startDate.' })
        }

        const end = endDate ? new Date(endDate) : start
        if (isNaN(end.getTime())) {
            return res
                .status(400)
                .json({ error: 'Invalid date format for endDate.' })
        }

        // Set time range
        const startOfDay = new Date(start.setHours(0, 0, 0, 0))
        const endOfDay = new Date(end.setHours(23, 59, 59, 999))

        // Find the switch
        const switchData = await Switch.findById(switchId).populate('account')
        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }

        const accountId = switchData.account._id

        // Find all uploaded file records within the date range
        const uploadedFiles = await DataModel.find({
            switch: switchId,
            uploadedAt: { $gte: startOfDay, $lte: endOfDay },
        })

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(404).json({
                error: 'No uploaded files found for the given date range.',
            })
        }

        // Calculate the total debit to be reversed
        const totalDebit = uploadedFiles.reduce((sum, file) => {
            return sum + parseFloat(file.Debit || 0)
        }, 0)

        // Update the account balance
        const account = await Account.findById(accountId)
        if (!account) {
            return res.status(404).json({ error: 'Account not found.' })
        }

        const currentBalance = parseFloat(account.balanceAsPerLedger || 0)
        account.balanceAsPerLedger = (currentBalance - totalDebit).toFixed(2)

        await account.save()

        // Delete the uploaded files
        const fileIds = uploadedFiles.map((file) => file._id)
        await DataModel.deleteMany({ _id: { $in: fileIds } })

        return res.status(200).json({
            message: 'Files removed and account balance updated successfully.',
            updatedBalance: account.balanceAsPerLedger,
        })
    } catch (err) {
        console.error('Error removing uploaded files:', err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

exports.statementFile = async (req, res) => {
    try {
        console.log('Request received with body:', req.body)
        console.log('User ID:', req.user.id)

        const file = req.file // Uploaded file
        const userId = req.user.id // User ID
        const switchId = req.body.switch // Switch ID from request body

        if (!file) {
            console.error('No file uploaded')
            return res.status(400).json({ error: 'No file was uploaded.' })
        }

        console.log('Uploaded file:', file)

        // Fetch the switch to get the account ID
        const switchData = await Switch.findById(switchId).populate('account')
        console.log('Switch data:', switchData)

        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }

        const accountId = switchData.account._id // Get the account ID from the switch
        console.log('Account ID:', accountId)

        const uploadSessionId = new mongoose.Types.ObjectId()

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key,
        })

        console.log('S3 Command:', command)

        const response = await s3.send(command)
        console.log('S3 Response received.')

        const s3FileStream = Readable.from(response.Body)
        const fileData = await new Promise((resolve, reject) => {
            const chunks = []
            s3FileStream.on('data', (chunk) => chunks.push(chunk))
            s3FileStream.on('end', () => resolve(Buffer.concat(chunks)))
            s3FileStream.on('error', (err) => {
                console.error('S3 File Stream Error:', err)
                reject(err)
            })
        })

        console.log('File data fetched from S3. Processing...')

        let jsonData
        const parseCSV = (data, keys) => {
            return new Promise((resolve, reject) => {
                Papa.parse(data, {
                    header: true,
                    dynamicTyping: true, // Ensure numeric values are parsed correctly
                    skipEmptyLines: true, // Ignore empty lines
                    complete: (results) => {
                        const sanitizedData = results.data.map((row) => {
                            row[keys[3]] = parseFloat(
                                (row[keys[3]] || '0')
                                    .toString()
                                    .replace(/[^0-9.-]/g, '')
                            )
                            return row
                        })
                        resolve(
                            sanitizedData.filter((row) =>
                                Object.values(row).some(Boolean)
                            )
                        )
                    },
                    error: (err) => reject(err),
                })
            })
        }

        if (file.mimetype === 'text/csv') {
            console.log('Processing CSV file.')
            const csvData = fileData.toString('utf-8')

            const initialResults = Papa.parse(csvData, { header: true })
            const keys = Object.keys(initialResults.data[0]) // Extract keys from the header

            // Pass keys to parseCSV
            jsonData = await parseCSV(csvData, keys)
        } else if (
            file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            console.log('Processing XLSX file.')
            const workbook = XLSX.read(fileData, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            jsonData = XLSX.utils.sheet_to_json(sheet)
        } else {
            console.error('Unsupported file format:', file.mimetype)
            return res.status(400).json({ error: 'Unsupported file format.' })
        }

        // Extracting keys dynamically
        const keys = Object.keys(jsonData[0])

        // Convert Excel dates if present
        const convertExcelDate = (excelDate) => {
            const date = new Date((excelDate - 25569) * 86400 * 1000) // Excel stores dates starting from 1900
            return date.toLocaleDateString('en-GB', {
                year: '2-digit',
                month: 'short',
                day: '2-digit',
            })
        }

        const mappedData = jsonData.map((row) => ({
            PostDate: isNaN(row[keys[0]])
                ? row[keys[0]]
                : convertExcelDate(row[keys[0]]),
            ValDate: isNaN(row[keys[1]])
                ? row[keys[1]]
                : convertExcelDate(row[keys[1]]),
            Details: row[keys[2]],
            Credit: row[keys[3]] || '0.00',
            Debit: 0.0,
            USID: row[keys[4]] || '0.00',
        }))

        console.log('Mapped data sample:', mappedData.slice(0, 5))

        const totalCredit = mappedData.reduce(
            (sum, row) => sum + parseFloat(row.Credit || 0),
            0
        )

        console.log('Total Credit:', totalCredit)

        const account = await Account.findById(accountId)
        if (!account) {
            console.error('Account not found for ID:', accountId)
            return res.status(404).json({ error: 'Account not found.' })
        }

        const currentBalance = parseFloat(account.balanceAsPerStmt || 0)
        console.log('Current Balance:', currentBalance)

        account.balanceAsPerStmt = (currentBalance + totalCredit).toFixed(2)

        console.log('Updated Balance:', account.balanceAsPerStmt)
        await account.save()

        await StatementModel.insertMany(
            mappedData.map((row) => ({
                userId,
                switch: switchId,
                accountId,
                uploadSessionId,
                ...row,
            }))
        )

        console.log('Data successfully saved to the database.')

        return res.status(200).json({
            message: 'File uploaded and data saved to the database.',
            fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
            updatedBalance: account.balanceAsPerStmt,
            totalCredit,
        })
    } catch (err) {
        console.error('Error uploading file:', err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}
exports.removeUploadedFileForStatement = async (req, res) => {
    try {
        const { switchId, startDate, endDate } = req.body

        // Validate input
        if (!switchId || !startDate) {
            return res
                .status(400)
                .json({ error: 'Switch ID and Uploaded Date are required.' })
        }

        // Parse the uploadedAt date string
        const start = new Date(startDate)
        if (isNaN(start.getTime())) {
            return res
                .status(400)
                .json({ error: 'Invalid date format for startDate.' })
        }

        const end = endDate ? new Date(endDate) : start
        if (isNaN(end.getTime())) {
            return res
                .status(400)
                .json({ error: 'Invalid date format for endDate.' })
        }

        // Set time range
        const startOfDay = new Date(start.setHours(0, 0, 0, 0))
        const endOfDay = new Date(end.setHours(23, 59, 59, 999))

        const switchData = await Switch.findById(switchId).populate('account')
        if (!switchData) {
            return res.status(404).json({ error: 'Switch not found.' })
        }

        const accountId = switchData.account._id // Get the account ID from the switch

        // Fetch the uploaded statements using the switch ID and date range
        const uploadedFiles = await StatementModel.find({
            switch: switchId,
            uploadedAt: { $gte: startOfDay, $lte: endOfDay },
        })

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res
                .status(404)
                .json({ error: 'No uploaded files found for the given date.' })
        }

        const totalCredit = uploadedFiles.reduce(
            (sum, statement) => sum + parseFloat(statement.Credit || 0),
            0
        )

        console.log('Total credit to reverse:', totalCredit)

        // Fetch the account and update the balance
        const account = await Account.findById(accountId)
        if (!account) {
            return res.status(404).json({ error: 'Account not found.' })
        }

        console.log('Current account balance:', account.balanceAsPerStmt)

        const currentBalance = parseFloat(account.balanceAsPerStmt || 0)
        const updatedBalance = (currentBalance - totalCredit).toFixed(2) // Reverse the total credit
        account.balanceAsPerStmt = updatedBalance

        console.log('Updated account balance:', updatedBalance)

        // Save the updated account balance
        await account.save()

        // Remove the statements associated with the switch ID and date range
        const fileIds = uploadedFiles.map((file) => file._id)
        await StatementModel.deleteMany({ _id: { $in: fileIds } })

        return res.status(200).json({
            message: 'Statements removed successfully and balance updated.',
            updatedBalance,
            balanceAsPerStmt: account.balanceAsPerStmt,
        })
    } catch (err) {
        console.error('Error removing uploaded statements:', err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

exports.getData = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.log('User object:', req.user)
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const userId = req.user.id

        // Find the most recent upload session for the user
        const lastUpload = await DataModel.find({ userId })
            .sort({ uploadedAt: -1 }) // Sort by most recent upload time
            .limit(1) // Get the most recent upload session

        if (!lastUpload.length) {
            return res
                .status(404)
                .json({ message: 'No data found for this user.' })
        }

        const lastUploadSessionId = lastUpload[0].uploadSessionId

        // Fetch all the data for the most recent upload session
        const data = await DataModel.find(
            { userId, uploadSessionId: lastUploadSessionId },
            { _id: 0, uploadedAt: 0, __v: 0, userId: 0 } // Exclude unnecessary fields
        )

        return res.status(200).json(data)
    } catch (err) {
        console.error('Error retrieving data from the database:', err)
        return res.status(500).send('Internal server error.')
    }
}

// exports.getStatement = async (req, res) => {
//     try {
//         if (!req.user || !req.user.id) {
//             console.log('User object:', req.user)
//             return res.status(401).json({ error: 'Unauthorized' })
//         }

//         const userId = req.user.id

//         const data = await StatementModel.find(
//             { userId },
//             // { _id: 0, uploadedAt: 0, __v: 0 }
//             { _id: 0, uploadedAt: 0, __v: 0, userId: 0 } //
//         )

//         return res.status(200).json(data)
//     } catch (err) {
//         console.error('Error retrieving data from the database:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }
exports.getStatement = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.log('User object:', req.user)
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const userId = req.user.id
        const lastUpload = await StatementModel.find({ userId })
            .sort({ uploadedAt: -1 }) // Sort by most recent upload time
            .limit(1) // Get the most recent upload session

        if (!lastUpload.length) {
            return res
                .status(404)
                .json({ message: 'No statement found for this user.' })
        }

        const lastUploadSessionId = lastUpload[0].uploadSessionId

        const data = await StatementModel.find(
            { userId, uploadSessionId: lastUploadSessionId },
            // { _id: 0, uploadedAt: 0, __v: 0 }
            { _id: 0, uploadedAt: 0, __v: 0, userId: 0 } //
        )

        return res.status(200).json(data)
    } catch (err) {
        console.error('Error retrieving data from the database:', err)
        return res.status(500).send('Internal server error.')
    }
}
exports.getStatementSwitch = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const userId = req.user.id
        const { switchId } = req.query // Read switchId (statement ID) from query

        // Fetch either a specific statement by switchId or all statements for the user
        const query = switchId ? { userId, _id: switchId } : { userId }

        const data = await StatementModel.find(query, {
            _id: 0,
            uploadedAt: 0,
            __v: 0,
            userId: 0,
        })

        // If no data found for specific switchId
        if (switchId && data.length === 0) {
            return res.status(404).json({ error: 'Statement not found' })
        }

        return res.status(200).json(data)
    } catch (err) {
        console.error('Error retrieving data from the database:', err)
        return res.status(500).send('Internal server error.')
    }
}
exports.getStatementById = async (req, res) => {
    try {
        const { id } = req.params

        // Fetch the statement by its ID
        const statement = await StatementModel.findById(id, {
            _id: 0,
            uploadedAt: 0,
            __v: 0,
            userId: 0,
        })

        if (!statement) {
            return res.status(404).json({ error: 'Statement not found' })
        }

        return res.status(200).json(statement)
    } catch (err) {
        console.error('Error retrieving statement:', err)
        return res.status(500).send('Internal server error.')
    }
}
// Controller to get a statement by switch ID
// Controller to get all statements by switch ID
// exports.getStatementsBySwitchId = async (req, res) => {
//     try {
//         const { switchId } = req.params

//         // Fetch all statements with the matching switch ID
//         const statements = await StatementModel.find(
//             { switch: switchId },
//             {
//                 _id: 0, // Exclude fields if necessary
//                 uploadedAt: 0,
//                 __v: 0,
//                 userId: 0,
//             }
//         )

//         if (statements.length === 0) {
//             return res
//                 .status(404)
//                 .json({ error: 'No statements found for this switch' })
//         }

//         return res.status(200).json(statements)
//     } catch (err) {
//         console.error('Error retrieving statements:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }
// Controller to get all statements by switch ID for the authenticated user

// exports.getStatementsBySwitchId = async (req, res) => {
//     try {
//         const { switchId } = req.params
//         const userId = req.user.id // Assuming req.user contains the authenticated user's details

//         // Fetch all statements with the matching switch ID and user ID
//         const statements = await StatementModel.find(
//             { switch: switchId, userId: userId }, // Match both switch and userId
//             {
//                 _id: 0, // Exclude fields if necessary
//                 uploadedAt: 0,
//                 __v: 0,
//                 userId: 0,
//             }
//         )

//         if (statements.length === 0) {
//             return res
//                 .status(404)
//                 .json({ error: 'No statements found for this switch or user' })
//         }

//         return res.status(200).json(statements)
//     } catch (err) {
//         console.error('Error retrieving statements:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }
// exports.getLedgerBySwitchId = async (req, res) => {
//     try {
//         const { switchId } = req.params
//         const userId = req.user.id // Assuming req.user contains the authenticated user's details

//         // Fetch all statements with the matching switch ID and user ID
//         const statements = await DataModel.find(
//             { switch: switchId, userId: userId }, // Match both switch and userId
//             {
//                 _id: 0, // Exclude fields if necessary
//                 uploadedAt: 0,
//                 __v: 0,
//                 userId: 0,
//             }
//         )

//         if (statements.length === 0) {
//             return res
//                 .status(404)
//                 .json({ error: 'No ledger found for this switch or user' })
//         }

//         return res.status(200).json(statements)
//     } catch (err) {
//         console.error('Error retrieving ledger:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }

// exports.getStatementsBySwitchId = async (req, res) => {
//     try {
//         const { switchId } = req.params
//         const userId = req.user.id // Assuming req.user contains the authenticated user's details

//         // Fetch the latest statement with the matching switch ID and user ID
//         const latestStatement = await StatementModel.findOne(
//             { switch: switchId, userId: userId }, // Match both switch and userId
//             {
//                 _id: 0, // Exclude fields if necessary
//                 uploadedAt: 0,
//                 __v: 0,
//                 userId: 0,
//             }
//         ).sort({ uploadedAt: -1 }) // Sort by upload date descending

//         if (!latestStatement) {
//             return res
//                 .status(404)
//                 .json({ error: 'No statements found for this switch or user' })
//         }

//         return res.status(200).json(latestStatement)
//     } catch (err) {
//         console.error('Error retrieving statements:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }
exports.getStatementsBySwitchId = async (req, res) => {
    try {
        const { switchId } = req.params
        const userId = req.user.id // Assuming req.user contains the authenticated user's details

        console.log('Received switchId:', switchId)
        console.log('Received userId:', userId)

        // Find the latest uploaded session for the user and switch
        const latestStatement = await StatementModel.findOne({
            switch: switchId,
            userId: userId,
        }).sort({ uploadedAt: -1 })

        if (!latestStatement) {
            return res
                .status(404)
                .json({ error: 'No statements found for this switch or user' })
        }

        const latestUploadSessionId = latestStatement.uploadSessionId
        console.log('Latest uploadSessionId:', latestUploadSessionId)

        // Fetch all statements with the latest upload session
        const statements = await StatementModel.find(
            {
                switch: switchId,
                userId: userId,
                uploadSessionId: latestUploadSessionId,
            },
            {
                _id: 0, // Exclude fields if necessary
                uploadedAt: 0,
                __v: 0,
                userId: 0,
            }
        ).sort({ PostDate: -1 }) // You can change the sorting if needed

        if (statements.length === 0) {
            return res.status(404).json({
                error: 'No statements found for this switch or user in the latest session',
            })
        }

        return res.status(200).json(statements) // Return statements from the latest upload session
    } catch (err) {
        console.error('Error retrieving statements:', err)
        return res.status(500).send('Internal server error.')
    }
}

exports.getLedgerBySwitchId = async (req, res) => {
    try {
        const { switchId } = req.params
        const userId = req.user.id // Assuming req.user contains the authenticated user's details
        console.log('Received switchId:', switchId)
        console.log('Received userId:', userId)

        // Fetch the most recent ledger data for the specific switchId and userId
        const latestLedger = await DataModel.findOne({
            switch: switchId,
            userId: userId,
        }).sort({ uploadedAt: -1 })

        if (!latestLedger) {
            return res
                .status(404)
                .json({ error: 'No ledger found for this switch or user' })
        }
        const latestUploadSessionId = latestLedger.uploadSessionId
        console.log('Latest uploadSessionId:', latestUploadSessionId)

        // Fetch all statements with the latest upload session
        const ledgers = await DataModel.find(
            {
                switch: switchId,
                userId: userId,
                uploadSessionId: latestUploadSessionId,
            },
            {
                _id: 0, // Exclude fields if necessary
                uploadedAt: 0,
                __v: 0,
                userId: 0,
            }
        ).sort({ PostDate: -1 }) // You can change the sorting if needed

        if (ledgers.length === 0) {
            return res.status(404).json({
                error: 'No ledger found for this switch or user in the latest session',
            })
        }

        return res.status(200).json(ledgers)
    } catch (err) {
        console.error('Error retrieving ledger:', err)
        return res.status(500).send('Internal server error.')
    }
}

// exports.deleteData = async (req, res) => {
//     try {
//         const userId = req.user.id // Get the user's ID from authentication

//         await DataModel.deleteMany({ userId })

//         return res.status(200).send('Data deleted successfully.')
//     } catch (err) {
//         console.error('Error deleting data:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }
// exports.getAccountById = async (req, res) => {
//     try {
//         const accountId = req.params.accountId
//         const account = await Account.findById(accountId) // Assuming you are using Mongoose

//         if (!account) {
//             return res.status(404).json({ message: 'Account not found' })
//         }

//         res.json(account)
//     } catch (error) {
//         console.error('Error fetching account:', error)
//         res.status(500).json({ message: 'Server error' })
//     }
// }
exports.getAccountById = async (req, res) => {
    try {
        const accountId = req.params.accountId
        const currentDate = new Date() // Get current date
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        // Fetch the parent account first
        const parentAccount = await Account.findById(accountId)

        if (!parentAccount) {
            return res.status(404).json({ message: 'Account not found' })
        }

        // Look for a child account for the current month
        const childAccount = await Account.findOne({
            parentAccountId: accountId,
            balanceAsPerLedgerDate: {
                $gte: new Date(currentYear, currentMonth, 1), // Start of month
                $lt: new Date(currentYear, currentMonth + 1, 1), // Start of next month
            },
        })

        if (childAccount) {
            return res.json(childAccount) // Return the correct monthly account
        }

        // If no child account found, return parent (fallback)
        return res.json(parentAccount)
    } catch (error) {
        console.error('Error fetching account:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.deleteData = async (req, res) => {
    try {
        const userId = req.user.id // Get the user's ID from authentication

        const deleteResult = await DataModel.deleteMany({ userId })

        if (deleteResult.deletedCount === 0) {
            return res.status(404).send('No data found for deletion.')
        }

        return res.status(200).send('Data deleted successfully.')
    } catch (err) {
        console.error('Error deleting data:', err.message) // Log the specific error message
        return res.status(500).send('Internal server error.')
    }
}

// Controller function to get data by ID
exports.getDataById = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.log('User object:', req.user)
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const userId = req.user.id

        // Query the database for all data belonging to the specified user
        const data = await DataModel.find(
            { userId },
            { _id: 0, uploadedAt: 0, __v: 0, userId: 0 }
        )

        return res.status(200).json(data)
    } catch (err) {
        console.error('Error retrieving data from the database:', err)
        return res.status(500).send('Internal server error.')
    }
}

// exports.checkIfDataExistsInDatabase = async () => {
//     try {
//         // Make an API call to check if data exists in the database
//         const response = await axios.get(
//             'http://localhost:5000/api/check-data-exists'
//         )
//         return response.data.exists // Adjust this based on your API response structure
//     } catch (error) {
//         console.error('Error checking data in the database:', error)
//         return false // Return false if there's an error or if data doesn't exist
//     }
// }
exports.checkDataExistsInDatabase = async (req, res) => {
    try {
        const userId = req.user.id
        const userUploadedData = await DataModel.find({ userId })

        // Check if user has uploaded data
        const dataExists = userUploadedData.length > 0

        res.json({ exists: dataExists })
    } catch (error) {
        console.error('Error checking data in the database:', error)
        res.status(500).json({
            error: 'An error occurred while checking data.',
        })
    }
}

exports.checkStatementExistsInDatabase = async (req, res) => {
    try {
        const userId = req.user.id
        const userUploadedData = await StatementModel.find({ userId })

        // Check if user has uploaded data
        const dataExists = userUploadedData.length > 0

        res.json({ exists: dataExists })
    } catch (error) {
        console.error('Error checking data in the database:', error)
        res.status(500).json({
            error: 'An error occurred while checking data.',
        })
    }
}

// Fetch affiliates

exports.getAffiliates = async (req, res) => {
    try {
        const affiliates = await Affiliate.find({ userId: req.user.id })
        res.status(200).json(affiliates)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching affiliates', error })
    }
}

// Fetch domains for an affiliate
exports.getDomains = async (req, res) => {
    try {
        const domains = await Domain.find({ affiliate: req.params.affiliateId })
        res.status(200).json(domains)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching domains', error })
    }
}

// Fetch accounts for a domain
exports.getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ domain: req.params.domainId })
        res.status(200).json(accounts)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching accounts', error })
    }
}

// Switch session (Affiliate -> Domain -> Account -> Working Month)
// exports.switchSession = async (req, res) => {
//     const { affiliateId, domainId, accountId, month } = req.body

//     try {
//         const newSwitch = new Switch({
//             affiliate: affiliateId,
//             domain: domainId,
//             account: accountId,
//             month,
//         })

//         await newSwitch.save()
//         res.status(201).json(newSwitch)
//     } catch (error) {
//         res.status(500).json({ message: 'Error switching session', error })
//     }
// }
// Create or Retrieve Switch
exports.switchSession = async (req, res) => {
    try {
        const { affiliateId, domainId, accountId, month } = req.body

        // Check if a session with the same details already exists
        const existingSwitch = await Switch.findOne({
            affiliate: affiliateId,
            domain: domainId,
            account: accountId,
            month,
        })

        if (existingSwitch) {
            // If it exists, return the existing switch session
            return res.status(200).json(existingSwitch)
        }

        // If not, create a new switch session
        const newSwitch = new Switch({
            affiliate: affiliateId,
            domain: domainId,
            account: accountId,
            month,
        })

        const savedSwitch = await newSwitch.save()
        res.status(201).json(savedSwitch)
    } catch (error) {
        res.status(500).json({ error: 'Error creating or retrieving switch' })
    }
}

// exports.createAffiliate = async (req, res) => {
//     try {
//         const { affiliateName, affiliateDescription, affiliateDate } = req.body
//         const affiliate = new Affiliate({
//             userId: req.user.id, // Assuming userId is available from the authenticated user
//             affiliateName,
//             affiliateDescription,
//             affiliateDate,
//         })
//         const savedAffiliate = await affiliate.save()
//         res.status(201).json(savedAffiliate)
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating affiliate' })
//     }
// }
// Create Affiliate
exports.createAffiliate = async (req, res) => {
    try {
        const { affiliateName, affiliateDescription, affiliateDate } = req.body

        // Check if an affiliate with the same affiliateName already exists
        const existingAffiliate = await Affiliate.findOne({ affiliateName })

        if (existingAffiliate) {
            return res.status(400).json({
                error: 'Affiliate with the same name already exists',
            })
        }

        // Proceed with creating the affiliate if no duplicates are found
        const affiliate = new Affiliate({
            userId: req.user.id, // Assuming userId is available from the authenticated user
            affiliateName,
            affiliateDescription,
            affiliateDate,
        })

        const savedAffiliate = await affiliate.save()
        res.status(201).json(savedAffiliate)
    } catch (error) {
        console.error('Error creating affiliate:', error) // Detailed logging
        res.status(500).json({
            error: 'Error creating affiliate',
            details: error.message,
        })
    }
}

// Create Domain
// exports.createDomain = async (req, res) => {
//     try {
//         const { affiliateId, domainName, domainDescription } = req.body
//         const domain = new Domain({
//             userId: req.user.id,
//             affiliate: affiliateId,
//             domainName,
//             domainDescription,
//         })
//         const savedDomain = await domain.save()
//         res.status(201).json(savedDomain)
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating domain' })
//     }
// }
// Create Domain
exports.createDomain = async (req, res) => {
    try {
        const { affiliateId, domainName, domainDescription } = req.body

        // Check if a domain with the same domainName already exists for the affiliate
        const existingDomain = await Domain.findOne({
            affiliate: affiliateId,
            domainName: domainName,
        })

        if (existingDomain) {
            return res.status(400).json({
                error: 'Domain with the same name already exists for this affiliate',
            })
        }

        // Proceed with creating the domain if no duplicates are found
        const domain = new Domain({
            userId: req.user.id,
            affiliate: affiliateId,
            domainName,
            domainDescription,
        })

        const savedDomain = await domain.save()
        res.status(201).json(savedDomain)
    } catch (error) {
        console.error('Error creating domain:', error) // Detailed logging
        res.status(500).json({
            error: 'Error creating domain',
            details: error.message,
        })
    }
}

// exports.createAccount = async (req, res) => {
//     try {
//         const {
//             affiliateId,
//             domainId,
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             shortTitle,
//             currency,
//             internalRecord,
//             externalRecord,
//             balanceAsPerLedger,
//             balanceAsPerStmt,
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//         } = req.body

//         // Check if an account with the same internalAccount, externalAccount, or accountTitle already exists
//         const existingAccount = await Account.findOne({
//             $or: [{ internalAccount }, { externalAccount }],
//         })

//         if (existingAccount) {
//             return res.status(400).json({
//                 error: 'Account with the same internalAccount, externalAccount, ',
//             })
//         }

//         // Proceed with creating the account if no duplicates are found
//         const account = new Account({
//             userId: req.user.id,
//             affiliate: affiliateId,
//             domain: domainId,
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             shortTitle,
//             currency,
//             internalRecord,
//             externalRecord,
//             balanceAsPerLedger,
//             balanceAsPerStmt,
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//         })

//         const savedAccount = await account.save()
//         res.status(201).json(savedAccount)
//     } catch (error) {
//         console.error('Error creating account:', error) // Detailed logging
//         res.status(500).json({
//             error: 'Error creating account',
//             details: error.message,
//         })
//     }
// }

// exports.createAccount = async (req, res) => {
//     try {
//         const {
//             affiliateId,
//             domainId,
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             shortTitle,
//             currency,
//             internalRecord,
//             externalRecord,
//             balanceAsPerLedger,
//             balanceAsPerStmt,
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//             parentAccountId, // Added to distinguish parent and child
//         } = req.body

//         const currentMonth = new Date(balanceAsPerLedgerDate).getMonth() + 1

//         let existingAccount

//         if (parentAccountId) {
//             // Look for existing child account (monthly account)
//             // existingAccount = await Account.findOne({
//             //     parentAccountId,
//             //     balanceAsPerLedgerDate: {
//             //         $gte: new Date(
//             //             new Date(balanceAsPerLedgerDate).getFullYear(),
//             //             currentMonth - 1,
//             //             1
//             //         ),
//             //         $lt: new Date(
//             //             new Date(balanceAsPerLedgerDate).getFullYear(),
//             //             currentMonth,
//             //             1
//             //         ),
//             //     },
//             // })

//             existingAccount = await Account.findOne({
//                 parentAccountId,
//                 balanceAsPerLedgerDate: {
//                     $gte: new Date(
//                         balanceAsPerLedgerDate.getFullYear(),
//                         balanceAsPerLedgerDate.getMonth(),
//                         1
//                     ),
//                     $lt: new Date(
//                         balanceAsPerLedgerDate.getFullYear(),
//                         balanceAsPerLedgerDate.getMonth() + 1,
//                         1
//                     ),
//                 },
//             })
//         } else {
//             // Look for existing parent account
//             //     existingAccount = await Account.findOne({
//             //         internalAccount,
//             //         externalAccount,
//             //         accountTitle,
//             //     }).sort({ balanceAsPerLedgerDate: -1 }) // Latest balance
//             // }
//             existingAccount = await Account.findOne({
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//                 balanceAsPerLedgerDate: {
//                     $gte: new Date(
//                         new Date(balanceAsPerLedgerDate).getFullYear(),
//                         currentMonth - 1,
//                         1
//                     ),
//                     $lt: new Date(
//                         new Date(balanceAsPerLedgerDate).getFullYear(),
//                         currentMonth,
//                         1
//                     ),
//                 },

//             })
//         }

//         let finalBalanceLedger = balanceAsPerLedger || 0
//         let finalBalanceStmt = balanceAsPerStmt || 0

//         if (!existingAccount && parentAccountId) {
//             // If this is a new month and there's a parent, inherit the previous balance
//             const parentAccount = await Account.findById(parentAccountId)
//             if (parentAccount) {
//                 finalBalanceLedger = parentAccount.balanceAsPerLedger
//                 finalBalanceStmt = parentAccount.balanceAsPerStmt
//             }
//         }

//         if (!existingAccount) {
//             const newAccount = new Account({
//                 userId: req.user.id,
//                 affiliate: affiliateId,
//                 domain: domainId,
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//                 shortTitle,
//                 currency,
//                 internalRecord,
//                 externalRecord,
//                 balanceAsPerLedger: finalBalanceLedger,
//                 balanceAsPerStmt: finalBalanceStmt,
//                 balanceAsPerLedgerDate,
//                 balanceAsPerStatementDate,
//                 accountCode,
//                 accountClass,
//                 parentAccountId: parentAccountId || null,
//             })

//             const savedAccount = await newAccount.save()
//             return res.status(201).json(savedAccount)
//         } else {
//             return res
//                 .status(400)
//                 .json({ error: 'Account for this month already exists' })
//         }
//     } catch (error) {
//         console.error('Error creating account:', error)
//         res.status(500).json({
//             error: 'Error creating account',
//             details: error.message,
//         })
//     }
// }
// exports.createAccount = async (req, res) => {
//     try {
//         const {
//             affiliateId,
//             domainId,
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             shortTitle,
//             currency,
//             internalRecord,
//             externalRecord,
//             balanceAsPerLedger,
//             balanceAsPerStmt,
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//             parentAccountId, // Added to distinguish parent and child
//         } = req.body

//         const currentMonth = new Date(balanceAsPerLedgerDate).getMonth() + 1

//         let existingAccount

//         if (parentAccountId) {
//             // Look for existing child account (monthly account) based on ledger or statement date
//             existingAccount = await Account.findOne({
//                 parentAccountId,
//                 $or: [
//                     {
//                         balanceAsPerLedgerDate: {
//                             $gte: new Date(
//                                 balanceAsPerLedgerDate.getFullYear(),
//                                 balanceAsPerLedgerDate.getMonth(),
//                                 1
//                             ),
//                             $lt: new Date(
//                                 balanceAsPerLedgerDate.getFullYear(),
//                                 balanceAsPerLedgerDate.getMonth() + 1,
//                                 1
//                             ),
//                         },
//                     },
//                     {
//                         balanceAsPerStatementDate: {
//                             $gte: new Date(
//                                 balanceAsPerStatementDate.getFullYear(),
//                                 balanceAsPerStatementDate.getMonth(),
//                                 1
//                             ),
//                             $lt: new Date(
//                                 balanceAsPerStatementDate.getFullYear(),
//                                 balanceAsPerStatementDate.getMonth() + 1,
//                                 1
//                             ),
//                         },
//                     },
//                 ],
//             })
//         } else {
//             // Look for existing parent account based on ledger or statement date
//             existingAccount = await Account.findOne({
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//                 $or: [
//                     {
//                         balanceAsPerLedgerDate: {
//                             $gte: new Date(
//                                 new Date(balanceAsPerLedgerDate).getFullYear(),
//                                 currentMonth - 1,
//                                 1
//                             ),
//                             $lt: new Date(
//                                 new Date(balanceAsPerLedgerDate).getFullYear(),
//                                 currentMonth,
//                                 1
//                             ),
//                         },
//                     },
//                     {
//                         balanceAsPerStatementDate: {
//                             $gte: new Date(
//                                 new Date(
//                                     balanceAsPerStatementDate
//                                 ).getFullYear(),
//                                 currentMonth - 1,
//                                 1
//                             ),
//                             $lt: new Date(
//                                 new Date(
//                                     balanceAsPerStatementDate
//                                 ).getFullYear(),
//                                 currentMonth,
//                                 1
//                             ),
//                         },
//                     },
//                 ],
//             })
//         }

//         let finalBalanceLedger = balanceAsPerLedger || 0
//         let finalBalanceStmt = balanceAsPerStmt || 0

//         if (!existingAccount && parentAccountId) {
//             // If this is a new month and there's a parent, inherit the previous balance
//             const parentAccount = await Account.findById(parentAccountId)
//             if (parentAccount) {
//                 finalBalanceLedger = parentAccount.balanceAsPerLedger
//                 finalBalanceStmt = parentAccount.balanceAsPerStmt
//             }
//         }

//         if (!existingAccount) {
//             const newAccount = new Account({
//                 userId: req.user.id,
//                 affiliate: affiliateId,
//                 domain: domainId,
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//                 shortTitle,
//                 currency,
//                 internalRecord,
//                 externalRecord,
//                 balanceAsPerLedger: finalBalanceLedger,
//                 balanceAsPerStmt: finalBalanceStmt,
//                 balanceAsPerLedgerDate,
//                 balanceAsPerStatementDate,
//                 accountCode,
//                 accountClass,
//                 parentAccountId: parentAccountId || null,
//             })

//             const savedAccount = await newAccount.save()
//             return res.status(201).json(savedAccount)
//         } else {
//             return res
//                 .status(400)
//                 .json({ error: 'Account for this month already exists' })
//         }
//     } catch (error) {
//         console.error('Error creating account:', error)
//         res.status(500).json({
//             error: 'Error creating account',
//             details: error.message,
//         })
//     }
// }
exports.createAccount = async (req, res) => {
    try {
        const {
            affiliateId,
            domainId,
            internalAccount,
            externalAccount,
            accountTitle,
            shortTitle,
            currency,
            internalRecord,
            externalRecord,
            balanceAsPerLedger,
            balanceAsPerStmt,
            balanceAsPerLedgerDate,
            balanceAsPerStatementDate,
            accountCode,
            accountClass,
            parentAccountId,
        } = req.body

        const ledgerDate = new Date(balanceAsPerLedgerDate)
        const statementDate = new Date(balanceAsPerStatementDate)
        const currentMonth = ledgerDate.getMonth()
        const currentYear = ledgerDate.getFullYear()

        let existingAccount

        if (parentAccountId) {
            // Look for existing child account (monthly account) based on ledger or statement date
            existingAccount = await Account.findOne({
                parentAccountId,
                $or: [
                    {
                        balanceAsPerLedgerDate: {
                            $gte: new Date(
                                ledgerDate.getFullYear(),
                                ledgerDate.getMonth(),
                                1
                            ),
                            $lt: new Date(
                                ledgerDate.getFullYear(),
                                ledgerDate.getMonth() + 1,
                                1
                            ),
                        },
                    },
                    {
                        balanceAsPerStatementDate: {
                            $gte: new Date(
                                statementDate.getFullYear(),
                                statementDate.getMonth(),
                                1
                            ),
                            $lt: new Date(
                                statementDate.getFullYear(),
                                statementDate.getMonth() + 1,
                                1
                            ),
                        },
                    },
                ],
            })
        } else {
            // Look for existing parent account based on ledger or statement date
            existingAccount = await Account.findOne({
                internalAccount,
                externalAccount,
                accountTitle,
                $or: [
                    {
                        balanceAsPerLedgerDate: {
                            $gte: new Date(currentYear, currentMonth, 1),
                            $lt: new Date(currentYear, currentMonth + 1, 1),
                        },
                    },
                    {
                        balanceAsPerStatementDate: {
                            $gte: new Date(
                                statementDate.getFullYear(),
                                statementDate.getMonth(),
                                1
                            ),
                            $lt: new Date(
                                statementDate.getFullYear(),
                                statementDate.getMonth() + 1,
                                1
                            ),
                        },
                    },
                ],
            })
        }

        let finalBalanceLedger = balanceAsPerLedger || 0
        let finalBalanceStmt = balanceAsPerStmt || 0

        if (!existingAccount && parentAccountId) {
            // If this is a new month and there's a parent, inherit the previous balance
            const parentAccount = await Account.findById(parentAccountId)
            if (parentAccount) {
                finalBalanceLedger = parentAccount.balanceAsPerLedger
                finalBalanceStmt = parentAccount.balanceAsPerStmt
            }
        }

        if (!existingAccount) {
            const newAccount = new Account({
                userId: req.user.id,
                affiliate: affiliateId,
                domain: domainId,
                internalAccount,
                externalAccount,
                accountTitle,
                shortTitle,
                currency,
                internalRecord,
                externalRecord,
                balanceAsPerLedger: finalBalanceLedger,
                balanceAsPerStmt: finalBalanceStmt,
                balanceAsPerLedgerDate: ledgerDate,
                balanceAsPerStatementDate: statementDate,
                accountCode,
                accountClass,
                parentAccountId: parentAccountId || null,
            })

            const savedAccount = await newAccount.save()
            return res.status(201).json(savedAccount)
        } else {
            return res
                .status(400)
                .json({ error: 'Account for this month already exists' })
        }
    } catch (error) {
        console.error('Error creating account:', error)
        res.status(500).json({
            error: 'Error creating account',
            details: error.message,
        })
    }
}

// controllers/accountController.js

// POST /api/account/working-month
// exports.setWorkingMonth = async (req, res) => {
//     const { accountId, month } = req.body

//     if (!accountId || !month) {
//         return res
//             .status(400)
//             .json({ error: 'accountId and month are required.' })
//     }

//     try {
//         // 1. Check if an account already exists with the same month
//         const existingAccount = await Account.findOne({
//             parentAccountId: accountId, // Assuming 'parentAccountId' links to the original account
//             month: month,
//         })

//         if (existingAccount) {
//             // If found, return the existing account
//             return res.status(200).json(existingAccount)
//         }

//         // 2. If not found, create a new account for the selected month
//         const originalAccount = await Account.findById(accountId)
//         if (!originalAccount) {
//             return res
//                 .status(404)
//                 .json({ error: 'Original account not found.' })
//         }

//         // Clone the original account data
//         const newAccount = new Account({
//             ...originalAccount.toObject(),
//             _id: new mongoose.Types.ObjectId(), // Generate new ID
//             month: month, // Set the new month
//             parentAccountId: accountId, // Reference to the original account
//             createdAt: new Date(),
//             updatedAt: new Date(),
//         })

//         // Save the new account
//         await newAccount.save()

//         return res.status(201).json(newAccount)
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         return res.status(500).json({ error: 'Server error.' })
//     }
// }
// exports.setWorkingMonth = async (req, res) => {
//     const { accountId, month } = req.body

//     console.log('Received request:', { accountId, month }) // Log the incoming request

//     if (!accountId || !month) {
//         console.log('Validation failed: Missing accountId or month')
//         return res
//             .status(400)
//             .json({ error: 'accountId and month are required.' })
//     }

//     try {
//         // const monthDate = new Date(month)
//         // console.log('Converted month to Date:', monthDate)

//         const currentYear = new Date().getFullYear()

//         // Convert month (e.g., 'April') to a valid Date (e.g., 'April 2025')
//         const monthDate = moment(
//             `${month} ${currentYear}`,
//             'MMMM YYYY'
//         ).toDate() // Converts "April 2025" to Date

//         // Check if an account already exists with the same balanceAsPerLedgerDate
//         const existingAccount = await Account.findOne({
//             parentAccountId: accountId,
//             balanceAsPerLedgerDate: { $eq: monthDate },
//         })

//         console.log('Existing account check result:', existingAccount)

//         if (existingAccount) {
//             console.log('Account already exists, returning existing account.')
//             return res.status(200).json(existingAccount)
//         }

//         // If not found, create a new account for the selected month
//         const originalAccount = await Account.findById(accountId)
//         console.log('Original account found:', originalAccount)

//         if (!originalAccount) {
//             console.log('Original account not found.')
//             return res
//                 .status(404)
//                 .json({ error: 'Original account not found.' })
//         }

//         // Clone the original account data
//         const newAccount = new Account({
//             ...originalAccount.toObject(),
//             _id: new mongoose.Types.ObjectId(), // Generate new ID
//             parentAccountId: accountId,
//             balanceAsPerLedgerDate: monthDate, // Update the ledger date
//             balanceAsPerStatementDate: monthDate, // Update the statement date
//             createdAt: new Date(),
//             updatedAt: new Date(),
//         })

//         console.log('New account to be saved:', newAccount)

//         await newAccount.save()
//         console.log('New account saved successfully.')

//         return res.status(201).json(newAccount)
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         return res.status(500).json({ error: 'Server error.' })
//     }
// }

// exports.setWorkingMonth = async (req, res) => {
//     const { accountId, month } = req.body

//     console.log('Received request:', { accountId, month }) // Log the incoming request

//     if (!accountId || !month) {
//         console.log('Validation failed: Missing accountId or month')
//         return res
//             .status(400)
//             .json({ error: 'accountId and month are required.' })
//     }

//     try {
//         let monthDate
//         if (typeof month === 'string') {
//             const currentYear = new Date().getFullYear()
//             monthDate = moment
//                 .utc(`${month} ${currentYear}`, 'MMMM YYYY') // Use UTC directly
//                 .startOf('month') // Ensure the first day of the month
//                 .toDate()
//         } else if (typeof month === 'object') {
//             monthDate = new Date(month)
//         }

//         if (!monthDate || isNaN(monthDate.getTime())) {
//             return res.status(400).json({ error: 'Invalid month format.' })
//         }

//         // Check if an account already exists with the same balanceAsPerLedgerDate
//         const existingAccount = await Account.findOne({
//             parentAccountId: accountId,
//             balanceAsPerLedgerDate: { $eq: monthDate },
//         })

//         console.log('Existing account check result:', existingAccount)

//         if (existingAccount) {
//             console.log('Account already exists, returning existing account.')
//             return res.status(200).json(existingAccount)
//         }

//         // If not found, create a new account for the selected month
//         const originalAccount = await Account.findById(accountId)
//         console.log('Original account found:', originalAccount)

//         if (!originalAccount) {
//             console.log('Original account not found.')
//             return res
//                 .status(404)
//                 .json({ error: 'Original account not found.' })
//         }

//         // Clone the original account data
//         const newAccount = new Account({
//             ...originalAccount.toObject(),
//             _id: new mongoose.Types.ObjectId(), // Generate new ID
//             parentAccountId: accountId,
//             balanceAsPerLedgerDate: monthDate, // Update the ledger date
//             balanceAsPerStatementDate: monthDate, // Update the statement date
//             createdAt: new Date(),
//             updatedAt: new Date(),
//         })

//         console.log('New account to be saved:', newAccount)

//         await newAccount.save()
//         console.log('New account saved successfully.')

//         return res.status(201).json(newAccount)
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         return res.status(500).json({ error: 'Server error.' })
//     }
// }

// exports.setWorkingMonth = async (req, res) => {
//     try {
//         const { accountId, month } = req.body

//         const parentAccount = await Account.findById(accountId)
//         if (!parentAccount)
//             return res.status(404).json({ message: 'Account not found' })

//         const existingAccount = await Account.findOne({
//             parentAccountId: parentAccount._id,
//             balanceAsPerLedgerDate: {
//                 $gte: new Date(`${month}-01`),
//                 $lt: new Date(`${month}-31`),
//             },
//         })

//         if (existingAccount) {
//             return res
//                 .status(200)
//                 .json({
//                     message: 'Month already exists',
//                     account: existingAccount,
//                 })
//         }

//         const newAccount = new Account({
//             ...parentAccount.toObject(),
//             _id: mongoose.Types.ObjectId(),
//             parentAccountId: parentAccount._id,
//             balanceAsPerLedgerDate: new Date(`${month}-01`),
//         })
//         await newAccount.save()

//         res.status(201).json({
//             message: 'Working month set successfully',
//             account: newAccount,
//         })
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         res.status(500).json({ message: 'Error setting working month' })
//     }
// }

// exports.createAccount = async (req, res) => {
//     try {
//         const {
//             affiliateId,
//             domainId,
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             shortTitle,
//             currency,
//             internalRecord,
//             externalRecord,
//             balanceAsPerLedger,
//             balanceAsPerStmt,
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//         } = req.body

//         // Get the current working month (from the frontend or another logic)
//         const currentMonth = new Date(balanceAsPerLedgerDate).getMonth() + 1 // Extracting month

//         // Check if an account exists for this specific month
//         const existingAccount = await Account.findOne({
//             internalAccount,
//             externalAccount,
//             accountTitle,
//             balanceAsPerLedgerDate: {
//                 $gte: new Date(
//                     new Date(balanceAsPerLedgerDate).getFullYear(),
//                     currentMonth - 1,
//                     1
//                 ),
//                 $lt: new Date(
//                     new Date(balanceAsPerLedgerDate).getFullYear(),
//                     currentMonth,
//                     1
//                 ),
//             },
//         })

//         let finalBalanceLedger = balanceAsPerLedger || 0
//         let finalBalanceStmt = balanceAsPerStmt || 0

//         // If no record exists for this month, check if a previous month's record exists
//         if (!existingAccount) {
//             const previousMonthAccount = await Account.findOne({
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//             }).sort({ balanceAsPerLedgerDate: -1 }) // Get the latest previous entry

//             // Carry forward balance from the most recent month if available
//             if (previousMonthAccount) {
//                 finalBalanceLedger = previousMonthAccount.balanceAsPerLedger
//                 finalBalanceStmt = previousMonthAccount.balanceAsPerStmt
//             }
//         }

//         // Create a new account entry for the month if not found
//         if (!existingAccount) {
//             const account = new Account({
//                 userId: req.user.id,
//                 affiliate: affiliateId,
//                 domain: domainId,
//                 internalAccount,
//                 externalAccount,
//                 accountTitle,
//                 shortTitle,
//                 currency,
//                 internalRecord,
//                 externalRecord,
//                 balanceAsPerLedger: finalBalanceLedger,
//                 balanceAsPerStmt: finalBalanceStmt,
//                 balanceAsPerLedgerDate,
//                 balanceAsPerStatementDate,
//                 accountCode,
//                 accountClass,
//             })

//             const savedAccount = await account.save()
//             return res.status(201).json(savedAccount)
//         } else {
//             return res
//                 .status(400)
//                 .json({ error: 'Account for this month already exists' })
//         }
//     } catch (error) {
//         console.error('Error creating account:', error)
//         res.status(500).json({
//             error: 'Error creating account',
//             details: error.message,
//         })
//     }
// }

// exports.setWorkingMonth = async (req, res) => {
//     try {
//         const { accountId, month } = req.body

//         // Convert month string (e.g., "January") to the corresponding Date
//         const selectedMonth = new Date(`${month} 1, 2025 00:00:00 GMT`)

//         const parentAccount = await Account.findById(accountId)
//         if (!parentAccount)
//             return res.status(404).json({ message: 'Account not found' })

//         const existingAccount = await Account.findOne({
//             parentAccountId: parentAccount._id,
//             balanceAsPerLedgerDate: {
//                 $gte: selectedMonth,
//                 $lt: new Date(
//                     selectedMonth.getFullYear(),
//                     selectedMonth.getMonth() + 1,
//                     0
//                 ),
//             },
//         })

//         if (existingAccount) {
//             return res.status(200).json({
//                 message: 'Month already exists',
//                 account: existingAccount,
//             })
//         }

//         const newAccount = new Account({
//             ...parentAccount.toObject(),
//             _id: mongoose.Types.ObjectId(),
//             parentAccountId: parentAccount._id,
//             balanceAsPerLedgerDate: selectedMonth,
//             balanceAsPerStatementDate: selectedMonth, // Same date for both fields
//         })

//         await newAccount.save()

//         res.status(201).json({
//             message: 'Working month set successfully',
//             account: newAccount,
//         })
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         res.status(500).json({ message: 'Internal server error' })
//     }
// }

// exports.setWorkingMonth = async (req, res) => {
//     try {
//         const { accountId, month } = req.body
//         const selectedMonth = new Date(`${month} 1, 2025 00:00:00 GMT`)

//         // Get the parent account
//         const parentAccount = await Account.findById(accountId)
//         if (!parentAccount)
//             return res.status(404).json({ message: 'Account not found' })

//         // Find the existing child account for the selected month
//         let existingAccount = await Account.findOne({
//             parentAccountId: parentAccount._id,
//             balanceAsPerLedgerDate: {
//                 $gte: selectedMonth,
//                 $lt: new Date(
//                     selectedMonth.getFullYear(),
//                     selectedMonth.getMonth() + 1,
//                     0
//                 ),
//             },
//         })

//         // If the month exists, return the existing child account
//         if (existingAccount) {
//             return res.status(200).json({
//                 message: 'Month already exists',
//                 account: existingAccount,
//             })
//         }

//         // ✅ FIX: Update the parent account first with the new balance
//         parentAccount.balanceAsPerLedger =
//             req.body.balanceAsPerLedger || parentAccount.balanceAsPerLedger
//         parentAccount.balanceAsPerStmt =
//             req.body.balanceAsPerStmt || parentAccount.balanceAsPerStmt
//         await parentAccount.save() // Save parent update

//         // ✅ FIX: Create the child account and inherit the updated balance from parent
//         const newAccount = new Account({
//             userId: parentAccount.userId,
//             affiliate: parentAccount.affiliate,
//             domain: parentAccount.domain,
//             internalAccount: parentAccount.internalAccount,
//             externalAccount: parentAccount.externalAccount,
//             accountTitle: parentAccount.accountTitle,
//             shortTitle: parentAccount.shortTitle,
//             currency: parentAccount.currency,
//             internalRecord: parentAccount.internalRecord,
//             externalRecord: parentAccount.externalRecord,
//             balanceAsPerLedger: parentAccount.balanceAsPerLedger, // Inherit new balance
//             balanceAsPerStmt: parentAccount.balanceAsPerStmt, // Inherit new balance
//             balanceAsPerLedgerDate: selectedMonth,
//             balanceAsPerStatementDate: selectedMonth,
//             accountCode: parentAccount.accountCode,
//             accountClass: parentAccount.accountClass,
//             parentAccountId: parentAccount._id,
//         })

//         await newAccount.save()

//         res.status(201).json({
//             message: 'Working month set successfully',
//             account: newAccount,
//         })
//     } catch (error) {
//         console.error('Error setting working month:', error)
//         res.status(500).json({ message: 'Internal server error' })
//     }
// }

exports.setWorkingMonth = async (req, res) => {
    try {
        const { accountId, month, balanceAsPerLedger, balanceAsPerStmt } =
            req.body
        const selectedMonth = new Date(`${month} 1, 2025 00:00:00 GMT`)

        console.log('🚀 Incoming Request:', req.body)

        // Get the parent account
        const parentAccount = await Account.findById(accountId)
        if (!parentAccount) {
            console.log('❌ Parent account not found')
            return res.status(404).json({ message: 'Account not found' })
        }

        console.log('✅ Parent Account Found:', parentAccount)

        // Find the existing child account for the selected month
        let existingAccount = await Account.findOne({
            parentAccountId: parentAccount._id,
            balanceAsPerLedgerDate: {
                $gte: selectedMonth,
                $lt: new Date(
                    selectedMonth.getFullYear(),
                    selectedMonth.getMonth() + 1,
                    0
                ),
            },
        })

        if (existingAccount) {
            console.log('🟢 Existing Child Account Found:', existingAccount)

            // ✅ Update the existing child account
            existingAccount.balanceAsPerLedger =
                balanceAsPerLedger || existingAccount.balanceAsPerLedger
            existingAccount.balanceAsPerStmt =
                balanceAsPerStmt || existingAccount.balanceAsPerStmt
            existingAccount.updatedAt = new Date()

            await existingAccount.save()

            console.log('🔄 Child Account Updated:', existingAccount)

            return res.status(200).json({
                message: 'Month already exists, updated balance',
                account: existingAccount,
            })
        }

        console.log('⚠️ No existing child account found, creating new one...')

        if (existingAccount) {
            // ✅ Update existing child account with uploaded balance
            existingAccount.balanceAsPerLedger = balanceAsPerLedger
            existingAccount.balanceAsPerStmt = balanceAsPerStmt
            existingAccount.updatedAt = new Date()

            await existingAccount.save()
            console.log('✅ Child Account Balance Updated:', existingAccount)

            return res.status(200).json({
                message: 'Updated balance for existing month',
                account: existingAccount,
            })
        }

        // ✅ Only update the parent if there's no child account for this month
        parentAccount.balanceAsPerLedger =
            balanceAsPerLedger || parentAccount.balanceAsPerLedger
        parentAccount.balanceAsPerStmt =
            balanceAsPerStmt || parentAccount.balanceAsPerStmt
        await parentAccount.save()

        console.log('🟢 Parent Account Updated:', parentAccount)

        // ✅ Create the child account with updated balances
        const newAccount = new Account({
            userId: parentAccount.userId,
            affiliate: parentAccount.affiliate,
            domain: parentAccount.domain,
            internalAccount: parentAccount.internalAccount,
            externalAccount: parentAccount.externalAccount,
            accountTitle: parentAccount.accountTitle,
            shortTitle: parentAccount.shortTitle,
            currency: parentAccount.currency,
            internalRecord: parentAccount.internalRecord,
            externalRecord: parentAccount.externalRecord,
            balanceAsPerLedger: parentAccount.balanceAsPerLedger, // Inherit latest balance
            balanceAsPerStmt: parentAccount.balanceAsPerStmt, // Inherit latest balance
            balanceAsPerLedgerDate: selectedMonth,
            balanceAsPerStatementDate: selectedMonth,
            accountCode: parentAccount.accountCode,
            accountClass: parentAccount.accountClass,
            parentAccountId: parentAccount._id,
        })

        await newAccount.save()

        console.log('✅ New Child Account Created:', newAccount)

        res.status(201).json({
            message: 'Working month set successfully',
            account: newAccount,
        })
    } catch (error) {
        console.error('❌ Error setting working month:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

exports.getAccountMonths = async (req, res) => {
    try {
        const accountId = req.params.accountId

        const accounts = await Account.find(
            {
                $or: [
                    { _id: accountId },
                    { parentAccountId: accountId }, // Link accounts via parentAccountId
                ],
            },
            'balanceAsPerLedgerDate'
        )

        const uniqueMonths = [
            ...new Set(
                accounts.map((account) =>
                    account.balanceAsPerLedgerDate?.toISOString().slice(0, 7)
                )
            ),
        ].filter(Boolean)

        res.status(200).json(uniqueMonths)
    } catch (error) {
        console.error('Error fetching months:', error)
        res.status(500).json({ message: 'Error fetching months' })
    }
}

exports.deleteAccount = async (req, res) => {
    try {
        const { accountId } = req.params

        // Find and delete the account by its ID
        const deletedAccount = await Account.findByIdAndDelete(accountId)

        if (!deletedAccount) {
            return res.status(404).json({
                error: 'Account not found',
            })
        }

        res.status(200).json({
            message: 'Account deleted successfully',
            deletedAccount,
        })
    } catch (error) {
        console.error('Error deleting account:', error)
        res.status(500).json({
            error: 'Error deleting account',
            details: error.message,
        })
    }
}

// Create Switch
// exports.createSwitch = async (req, res) => {
//     try {
//         const { affiliateId, domainId, accountId, month } = req.body
//         const switchData = new Switch({
//             affiliate: affiliateId,
//             domain: domainId,
//             account: accountId,
//             month,
//         })
//         const savedSwitch = await switchData.save()
//         res.status(201).json(savedSwitch)
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating switch' })
//     }
// }

// Create or retrieve existing switch
exports.createSwitch = async (req, res) => {
    try {
        const { affiliateId, domainId, accountId, month } = req.body

        // Check if a session with the same details already exists
        const existingSwitch = await Switch.findOne({
            affiliate: affiliateId,
            domain: domainId,
            account: accountId,
            month,
        })

        if (existingSwitch) {
            // If it exists, return the existing switch session
            return res.status(200).json(existingSwitch)
        }

        // If not, create a new switch session
        const newSwitch = new Switch({
            affiliate: affiliateId,
            domain: domainId,
            account: accountId,
            month,
        })

        const savedSwitch = await newSwitch.save()
        res.status(201).json(savedSwitch)
    } catch (error) {
        res.status(500).json({ error: 'Error creating or retrieving switch' })
    }
}

exports.getAccountsByAffiliateAndDomain = async (req, res) => {
    try {
        const { affiliateId, domainId } = req.query // Assuming affiliateId and domainId are passed as query parameters

        if (!affiliateId || !domainId) {
            return res
                .status(400)
                .json({ error: 'Affiliate ID and Domain ID are required' })
        }

        // Find accounts associated with the affiliate and domain
        const accounts = await Account.find({
            affiliate: affiliateId,
            domain: domainId,
        })

        if (accounts.length === 0) {
            return res.status(404).json({
                message:
                    'No accounts found for the specified affiliate and domain',
            })
        }

        res.status(200).json(accounts)
    } catch (error) {
        console.error('Error fetching accounts:', error)
        res.status(500).json({ error: 'Error fetching accounts' })
    }
}
exports.getDomainByAffiliate = async (req, res) => {
    try {
        const { affiliateId } = req.query // Assuming affiliateId and domainId are passed as query parameters

        if (!affiliateId) {
            return res.status(400).json({ error: 'Affiliate ID is required' })
        }

        // Find accounts associated with the affiliate and domain
        const accounts = await Domain.find({
            affiliate: affiliateId,
        })

        if (accounts.length === 0) {
            return res.status(404).json({
                message: 'No accounts found for the specified affiliate',
            })
        }

        res.status(200).json(accounts)
    } catch (error) {
        console.error('Error fetching accounts:', error)
        res.status(500).json({ error: 'Error fetching accounts' })
    }
}
// Controller to get the last uploaded statement date
exports.getLastStatementDate = async (req, res) => {
    try {
        const currentSwitchSessionId = req.query.switchSessionId // Pass this from the frontend

        if (!currentSwitchSessionId) {
            return res
                .status(400)
                .json({ message: 'Switch session ID is required' })
        }

        const lastStatement = await StatementModel.findOne({
            userId: req.user.id, // Get the logged-in user
            switch: currentSwitchSessionId, // Filter by the current switch session
        })
            .sort({ uploadedAt: -1 }) // Sort by uploadedAt in descending order
            .select('uploadedAt uploadSessionId') // Select only the fields you need
            .lean()

        if (!lastStatement) {
            return res.status(404).json({ message: 'No statements found' })
        }

        res.status(200).json({
            uploadedAt: lastStatement.uploadedAt,
            uploadSessionId: lastStatement.uploadSessionId,
        })
    } catch (error) {
        console.error('Error fetching last statement date:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Controller to get the last uploaded ledger date
// exports.getLastLedgerDate = async (req, res) => {
//     console.log('Current user ID:', req.user._id) // Log the user ID

//     try {
//         const lastLedger = await DataModel.findOne({
//             userId: req.user.id, // Get the logged-in user
//         })
//             .sort({ uploadedAt: -1 }) // Sort by uploadedAt in descending order
//             .select('uploadedAt uploadSessionId') // Select only the fields you need
//             .lean()
//         console.log('Last Ledger:', lastLedger) // Log the last ledger found

//         if (!lastLedger) {
//             return res.status(404).json({ message: 'No ledgers found' })
//         }

//         res.status(200).json({
//             uploadedAt: lastLedger.uploadedAt,
//             uploadSessionId: lastLedger.uploadSessionId,
//         })
//     } catch (error) {
//         console.error('Error fetching last ledger date:', error)
//         res.status(500).json({ message: 'Server error' })
//     }
// }
exports.getLastLedgerDate = async (req, res) => {
    console.log('Current user ID:', req.user._id) // Log the user ID

    try {
        // Retrieve the current switch session from the user's session
        const currentSwitchSessionId = req.query.switchSessionId // Pass this from the frontend

        if (!currentSwitchSessionId) {
            return res
                .status(400)
                .json({ message: 'Switch session ID is required' })
        }

        const lastLedger = await DataModel.findOne({
            userId: req.user.id, // Filter by user ID
            switch: currentSwitchSessionId, // Filter by the current switch session
        })
            .sort({ uploadedAt: -1 }) // Sort by uploadedAt in descending order
            .select('uploadedAt uploadSessionId') // Select only the fields you need
            .lean()

        console.log('Last Ledger:', lastLedger) // Log the last ledger found

        if (!lastLedger) {
            return res
                .status(404)
                .json({ message: 'No ledgers found for this switch' })
        }

        res.status(200).json({
            uploadedAt: lastLedger.uploadedAt,
            uploadSessionId: lastLedger.uploadSessionId,
        })
    } catch (error) {
        console.error('Error fetching last ledger date:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.getAllLedgerBySwitchId = async (req, res) => {
    try {
        const { switchId } = req.params
        const userId = req.user.id // Assuming req.user contains the authenticated user's details
        console.log('Received switchId:', switchId)
        console.log('Received userId:', userId)

        // Fetch all ledger items for the specific switchId and userId
        const ledgers = await DataModel.find(
            {
                switch: switchId,
                userId: userId,
            },
            {
                _id: 0, // Exclude fields if necessary
                uploadedAt: 0,
                __v: 0,
                userId: 0,
            }
        ).sort({ PostDate: -1 }) // You can change the sorting if needed

        if (ledgers.length === 0) {
            return res.status(404).json({
                error: 'No ledger items found for this switch or user',
            })
        }

        // Compute the total count of ledger items
        const totalLedgerCount = ledgers.length

        // Optionally, compute totals for debit and credit values
        const totalDebit = ledgers.reduce(
            (sum, record) => sum + parseFloat(record.Debit || 0),
            0
        )
        const totalCredit = ledgers.reduce(
            (sum, record) => sum + parseFloat(record.Credit || 0),
            0
        )

        return res.status(200).json({
            totalLedgerCount,
            totalDebit: totalDebit.toFixed(2),
            totalCredit: totalCredit.toFixed(2),
            ledgers, // Return all ledger items if needed
        })
    } catch (err) {
        console.error('Error retrieving ledger:', err)
        return res.status(500).send('Internal server error.')
    }
}
exports.getAllStatementsBySwitchId = async (req, res) => {
    try {
        const { switchId } = req.params
        const userId = req.user.id // Assuming req.user contains the authenticated user's details

        console.log('Received switchId:', switchId)
        console.log('Received userId:', userId)

        // Fetch all statements for the specific switchId and userId
        const statements = await StatementModel.find(
            {
                switch: switchId,
                userId: userId,
            },
            {
                _id: 0, // Exclude fields if necessary
                uploadedAt: 0,
                __v: 0,
                userId: 0,
            }
        ).sort({ PostDate: -1 }) // Sort by PostDate in descending order

        if (statements.length === 0) {
            return res.status(404).json({
                error: 'No statements found for this switch or user',
            })
        }

        // Compute the total count of statements
        const totalStatementCount = statements.length

        // Optionally, compute totals for debit and credit values
        const totalDebit = statements.reduce(
            (sum, record) => sum + parseFloat(record.Debit || 0),
            0
        )
        const totalCredit = statements.reduce(
            (sum, record) => sum + parseFloat(record.Credit || 0),
            0
        )

        return res.status(200).json({
            totalStatementCount,
            totalDebit: totalDebit.toFixed(2),
            totalCredit: totalCredit.toFixed(2),
            statements, // Return all statements if needed
        })
    } catch (err) {
        console.error('Error retrieving statements:', err)
        return res.status(500).send('Internal server error.')
    }
}
