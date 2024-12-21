const path = require('path')
const fs = require('fs')
const fastCsv = require('fast-csv')
const Papa = require('papaparse')
const DataModel = require('../models/DataModel')
const authenticateUser = require('../middlewares/authenticateUser')
const StatementModel = require('../models/StatementModel')
const mongoose = require('mongoose')
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
//         const file = req.file
//         const userId = req.user.id // Get the user's ID from the authentication
//         const switchId = req.body.switch // Get the switch ID from the request

//         if (!file) {
//             return res.status(400).send('No file was uploaded.')
//         }

//         // Fetch the switch to get the account ID
//         const switchData = await Switch.findById(switchId).populate('account')
//         if (!switchData) {
//             return res.status(404).send('Switch not found.')
//         }

//         const accountId = switchData.account._id // Get the account ID from the switch

//         const filePath = path.join(__dirname, '../uploads', file.filename)
//         // const filePath = path.join('/tmp', file.filename)

//         const fileStream = fs.createReadStream(filePath)

//         // Generate a new upload session ID
//         const uploadSessionId = new mongoose.Types.ObjectId()

//         Papa.parse(fileStream, {
//             header: true,
//             dynamicTyping: true,
//             complete: async (results) => {
//                 const jsonData = results.data
//                     .map((row) => {
//                         const keys = Object.keys(row)
//                         if (keys.length < 4) {
//                             throw new Error('Insufficient columns in the file.')
//                         }

//                         const mappedRow = {
//                             PostDate: row[keys[0]], // First column
//                             ValDate: row[keys[1]], // Second column
//                             Details: row[keys[2]], // Third column
//                             Debit:
//                                 parseFloat(
//                                     String(row[keys[3]]).replace(/,/g, '')
//                                 ) || 0.0, // Ensure Debit is a number
//                             Credit: 0.0, // Fourth column
//                             USID: row[keys[4]], // Fifth column
//                         }

//                         return mappedRow
//                     })
//                     .filter((row) => Object.values(row).some(Boolean))

//                 try {
//                     // Calculate the total debit from the parsed data for the current file
//                     const totalDebitForCurrentFile = jsonData.reduce(
//                         (sum, row) => sum + row.Debit,
//                         0
//                     )

//                     // Fetch the account
//                     const account = await Account.findById(accountId)
//                     if (!account) {
//                         return res.status(404).send('Account not found.')
//                     }

//                     // Update the balanceAsPerLedger with the total debit of this file
//                     const currentBalance = parseFloat(
//                         account.balanceAsPerLedger || 0
//                     )
//                     const updatedBalance =
//                         currentBalance + totalDebitForCurrentFile
//                     account.balanceAsPerLedger = updatedBalance.toString()

//                     await account.save()

//                     // Save each row to the DataModel with the account and session reference
//                     const promises = jsonData.map(async (row) => {
//                         await DataModel.create({
//                             userId,
//                             switch: switchId,
//                             accountId, // Use the account ID from the switch
//                             uploadSessionId, // Attach the upload session ID
//                             ...row,
//                         })
//                     })

//                     await Promise.all(promises)

//                     fs.unlinkSync(filePath) // Delete the uploaded file
//                     return res.status(200).json({
//                         message:
//                             'File uploaded and data saved to the database.',
//                         updatedBalance,
//                         totalDebitForCurrentFile,
//                     })
//                 } catch (err) {
//                     console.error('Error saving data:', err)
//                     return res.status(500).send('Error saving data.')
//                 }
//             },
//         })
//     } catch (err) {
//         console.error('Error uploading file:', err)
//         return res.status(500).send('Internal server error.')
//     }
// }

//for csv to work

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
//             const fileData = Buffer.concat(chunks).toString('utf-8')

//             try {
//                 Papa.parse(fileData, {
//                     header: true,
//                     dynamicTyping: true,
//                     complete: async (results) => {
//                         const jsonData = results.data // Ensure jsonData is accessible

//                         // Extracting keys dynamically
//                         const keys = Object.keys(jsonData[0])

//                         // Mapping rows with correct fields
//                         const mappedData = jsonData.map((row) => ({
//                             PostDate: row[keys[0]],
//                             ValDate: row[keys[1]],
//                             Details: row[keys[2]],
//                             Debit: row[keys[3]] || '0.00',
//                             Credit: 0.0,
//                             USID: row[keys[4]] || '0.00',
//                         }))

//                         try {
//                             // Ensure totalDebit is treated as a number
//                             const totalDebit = mappedData.reduce(
//                                 (sum, row) => sum + parseFloat(row.Debit || 0),
//                                 0
//                             )

//                             const account = await Account.findById(accountId)
//                             if (!account) {
//                                 return res
//                                     .status(404)
//                                     .json({ error: 'Account not found.' })
//                             }

//                             const currentBalance = parseFloat(
//                                 account.balanceAsPerLedger || 0
//                             )
//                             account.balanceAsPerLedger = (
//                                 currentBalance + totalDebit
//                             ).toFixed(2)

//                             await account.save()

//                             await DataModel.insertMany(
//                                 mappedData.map((row) => ({
//                                     userId,
//                                     switch: switchId,
//                                     accountId,
//                                     uploadSessionId,
//                                     ...row,
//                                 }))
//                             )

//                             return res.status(200).json({
//                                 message:
//                                     'File uploaded and data saved to the database.',
//                                 fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
//                                 updatedBalance: account.balanceAsPerLedger,
//                                 totalDebit,
//                             })
//                         } catch (err) {
//                             console.error('Error saving data:', err)
//                             return res
//                                 .status(500)
//                                 .json({ error: 'Error saving data.' })
//                         }
//                     },
//                 })
//             } catch (parseError) {
//                 console.error('Error parsing file:', parseError)
//                 return res.status(500).json({ error: 'Error parsing file.' })
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

//forxlsx to work

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

//             // Determine file type and process accordingly
//             if (file.mimetype === 'text/csv') {
//                 console.log('Processing CSV file.')
//                 const csvData = fileData.toString('utf-8')

//                 const parseCSV = (data) => {
//                     return new Promise((resolve, reject) => {
//                         Papa.parse(data, {
//                             header: true,
//                             dynamicTyping: true,
//                             complete: (results) => {
//                                 resolve(
//                                     results.data.filter((row) =>
//                                         Object.values(row).some(Boolean)
//                                     )
//                                 )
//                             },
//                             error: (err) => {
//                                 reject(err)
//                             },
//                         })
//                     })
//                 }

//                 jsonData = await parseCSV(csvData)
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
//                 // Debit: row[keys[3]] || '0.00',
//                 // Debit: row[keys[3]] ? Math.abs(row[keys[3]]) : 0,
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

        const accountId = switchData.account._id // Get the account ID from the switch

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
                console.log('Total Debit:', totalDebit, 'Total Credit:')

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

// exports.removeUploadedFile = async (req, res) => {
//     try {
//         const { switchId, uploadedAt } = req.body

//         // Validate input
//         if (!switchId || !uploadedAt) {
//             return res
//                 .status(400)
//                 .json({ error: 'Switch ID and Uploaded Date are required.' })
//         }

//         // Parse the uploadedAt date string
//         const uploadedDate = new Date(uploadedAt)
//         if (isNaN(uploadedDate.getTime())) {
//             return res
//                 .status(400)
//                 .json({ error: 'Invalid date format for uploadedAt.' })
//         }

//         // Create start and end of the day range
//         const startOfDay = new Date(uploadedDate.setHours(0, 0, 0, 0))
//         const endOfDay = new Date(uploadedDate.setHours(23, 59, 59, 999))

//         // Find the switch
//         const switchData = await Switch.findById(switchId).populate('account')
//         if (!switchData) {
//             return res.status(404).json({ error: 'Switch not found.' })
//         }

//         const accountId = switchData.account._id // Get the account ID from the switch

//         // Find all uploaded file records within the date range
//         const uploadedFiles = await DataModel.find({
//             switch: switchId,
//             uploadedAt: { $gte: startOfDay, $lte: endOfDay },
//         })

//         if (!uploadedFiles || uploadedFiles.length === 0) {
//             return res
//                 .status(404)
//                 .json({ error: 'No uploaded files found for the given date.' })
//         }

//         // Calculate the total debit to be reversed
//         const totalDebit = uploadedFiles.reduce((sum, file) => {
//             return sum + parseFloat(file.Debit || 0)
//         }, 0)

//         // Find and update the account balance
//         const account = await Account.findById(accountId)
//         if (!account) {
//             return res.status(404).json({ error: 'Account not found.' })
//         }

//         const currentBalance = parseFloat(account.balanceAsPerLedger || 0)
//         account.balanceAsPerLedger = (currentBalance - totalDebit).toFixed(2) // Reverse the total debit

//         await account.save()

//         // Delete all uploaded file records
//         const fileIds = uploadedFiles.map((file) => file._id)
//         await DataModel.deleteMany({ _id: { $in: fileIds } })

//         return res.status(200).json({
//             message: 'Files removed and account balance updated successfully.',
//             updatedBalance: account.balanceAsPerLedger,
//         })
//     } catch (err) {
//         console.error('Error removing uploaded files:', err)
//         return res.status(500).json({ error: 'Internal server error.' })
//     }
// }

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
            return res
                .status(404)
                .json({
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

//for csv to wrk perfectly
// exports.statementFile = async (req, res) => {
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
//         const uploadSessionId = new mongoose.Types.ObjectId()

//         const command = new GetObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: file.key,
//         })

//         const response = await s3.send(command)
//         const s3FileStream = Readable.from(response.Body)

//         const chunks = []
//         s3FileStream.on('data', (chunk) => chunks.push(chunk))
//         s3FileStream.on('end', async () => {
//             const fileContent = Buffer.concat(chunks).toString('utf-8')

//             try {
//                 Papa.parse(fileContent, {
//                     header: true,
//                     dynamicTyping: true,
//                     complete: async (results) => {
//                         const jsonData = results.data // Ensure jsonData is accessible
//                         const keys = Object.keys(jsonData[0])

//                         // Mapping rows with correct fields
//                         const mappedData = jsonData.map((row) => ({
//                             PostDate: row[keys[0]],
//                             ValDate: row[keys[1]],
//                             Details: row[keys[2]],
//                             Credit: row[keys[3]] || '0.00',
//                             Debit: 0.0,
//                             USID: row[keys[4]] || '0.00',
//                         }))

//                         try {
//                             // Ensure Credit is treated as a number
//                             const totalCredit = mappedData.reduce(
//                                 (sum, row) => sum + parseFloat(row.Credit || 0),
//                                 0
//                             )

//                             const account = await Account.findById(accountId)
//                             if (!account) {
//                                 return res
//                                     .status(404)
//                                     .json({ error: 'Account not found.' })
//                             }

//                             const currentBalance = parseFloat(
//                                 account.balanceAsPerStmt || 0
//                             )
//                             account.balanceAsPerStmt = (
//                                 currentBalance + totalCredit
//                             ).toFixed(2)

//                             await account.save()

//                             await StatementModel.insertMany(
//                                 mappedData.map((row) => ({
//                                     userId,
//                                     switch: switchId,
//                                     accountId,
//                                     uploadSessionId,
//                                     ...row,
//                                 }))
//                             )

//                             return res.status(200).json({
//                                 message:
//                                     'File uploaded and data saved to the database.',
//                                 fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,

//                                 updatedBalance: account.balanceAsPerStmt,
//                                 totalCredit,
//                             })
//                         } catch (err) {
//                             console.error('Error saving data:', err)
//                             return res
//                                 .status(500)
//                                 .json({ error: 'Error saving data.' })
//                         }
//                     },
//                 })
//             } catch (parseError) {
//                 console.error('Error parsing file:', parseError)
//                 return res.status(500).json({ error: 'Error parsing file.' })
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

//for xlsx to work

// exports.statementFile = async (req, res) => {
//     try {
//         console.log('Request received with body:', req.body)
//         console.log('User ID:', req.user.id)

//         const file = req.file // Uploaded file
//         const userId = req.user.id // User ID
//         const switchId = req.body.switch // Switch ID from request body

//         if (!file) {
//             console.error('No file uploaded')
//             return res.status(400).json({ error: 'No file was uploaded.' })
//         }

//         console.log('Uploaded file:', file)

//         // Fetch the switch to get the account ID
//         const switchData = await Switch.findById(switchId).populate('account')
//         console.log('Switch data:', switchData)

//         if (!switchData) {
//             return res.status(404).json({ error: 'Switch not found.' })
//         }

//         const accountId = switchData.account._id // Get the account ID from the switch
//         console.log('Account ID:', accountId)

//         const uploadSessionId = new mongoose.Types.ObjectId()

//         const command = new GetObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: file.key,
//         })

//         console.log('S3 Command:', command)

//         const response = await s3.send(command)
//         console.log('S3 Response received.')

//         const s3FileStream = Readable.from(response.Body)
//         const fileData = await new Promise((resolve, reject) => {
//             const chunks = []
//             s3FileStream.on('data', (chunk) => chunks.push(chunk))
//             s3FileStream.on('end', () => resolve(Buffer.concat(chunks)))
//             s3FileStream.on('error', (err) => {
//                 console.error('S3 File Stream Error:', err)
//                 reject(err)
//             })
//         })

//         console.log('File data fetched from S3. Processing...')

//         let jsonData

//         if (file.mimetype === 'text/csv') {
//             console.log('Processing CSV file.')
//             const csvData = fileData.toString('utf-8')

//             const parseCSV = (data) => {
//                 return new Promise((resolve, reject) => {
//                     Papa.parse(data, {
//                         header: true,
//                         dynamicTyping: true,
//                         complete: (results) => {
//                             console.log(
//                                 'CSV Parsing complete:',
//                                 results.data.slice(0, 5)
//                             )
//                             resolve(
//                                 results.data.filter((row) =>
//                                     Object.values(row).some(Boolean)
//                                 )
//                             )
//                         },
//                         error: (err) => {
//                             console.error('CSV Parsing Error:', err)
//                             reject(err)
//                         },
//                     })
//                 })
//             }

//             jsonData = await parseCSV(csvData)
//         } else if (
//             file.mimetype ===
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         ) {
//             console.log('Processing XLSX file.')
//             const workbook = XLSX.read(fileData, { type: 'buffer' })
//             const sheetName = workbook.SheetNames[0]
//             console.log('Selected Sheet:', sheetName)
//             const sheet = workbook.Sheets[sheetName]
//             jsonData = XLSX.utils.sheet_to_json(sheet)
//             console.log('Parsed XLSX data sample:', jsonData.slice(0, 5))
//         } else {
//             console.error('Unsupported file format:', file.mimetype)
//             return res.status(400).json({ error: 'Unsupported file format.' })
//         }

//         const keys = Object.keys(jsonData[0])
//         console.log('Keys from parsed data:', keys)

//         // const mappedData = jsonData.map((row) => ({

//         //  PostDate: isNaN(row[keys[0]]) ? row[keys[0]] : convertExcelDate(row[keys[0]]),
//         // ValDate: isNaN(row[keys[1]]) ? row[keys[1]] : convertExcelDate(row[keys[1]]),
//         //     Details: row[keys[2]],
//         //     Credit: row[keys[3]] || '0.00',
//         //     Debit: 0.0,
//         //     USID: row[keys[4]] || '0.00',
//         // }))

//         const mappedData = jsonData.map((row) => {
//             const convertExcelDate = (excelDate) => {
//                 const date = new Date((excelDate - 25569) * 86400 * 1000) // Excel stores dates starting from 1900
//                 return date.toLocaleDateString('en-GB', {
//                     // Customize the format as needed
//                     year: '2-digit',
//                     month: 'short',
//                     day: '2-digit',
//                 })
//             }

//             return {
//                 PostDate: isNaN(row[keys[0]])
//                     ? row[keys[0]]
//                     : convertExcelDate(row[keys[0]]),
//                 ValDate: isNaN(row[keys[1]])
//                     ? row[keys[1]]
//                     : convertExcelDate(row[keys[1]]),
//                 Details: row[keys[2]],
//                 Credit: row[keys[3]] || '0.00',
//                 Debit: 0.0,
//                 USID: row[keys[4]] || '0.00',
//             }
//         })

//         console.log('Mapped data sample:', mappedData.slice(0, 5))

//         const totalCredit = mappedData.reduce(
//             (sum, row) => sum + parseFloat(row.Credit || 0),
//             0
//         )

//         console.log('Total Credit:', totalCredit)

//         const account = await Account.findById(accountId)
//         if (!account) {
//             console.error('Account not found for ID:', accountId)
//             return res.status(404).json({ error: 'Account not found.' })
//         }

//         const currentBalance = parseFloat(account.balanceAsPerStmt || 0)
//         console.log('Current Balance:', currentBalance)

//         account.balanceAsPerStmt = (currentBalance + totalCredit).toFixed(2)

//         console.log('Updated Balance:', account.balanceAsPerStmt)
//         await account.save()

//         await StatementModel.insertMany(
//             mappedData.map((row) => ({
//                 userId,
//                 switch: switchId,
//                 accountId,
//                 uploadSessionId,
//                 ...row,
//             }))
//         )

//         console.log('Data successfully saved to the database.')

//         return res.status(200).json({
//             message: 'File uploaded and data saved to the database.',
//             fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
//             updatedBalance: account.balanceAsPerStmt,
//             totalCredit,
//         })
//     } catch (err) {
//         console.error('Error uploading file:', err)
//         return res.status(500).json({ error: 'Internal server error.' })
//     }
// }

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
        const { switchId, uploadedAt } = req.body

        // Validate input
        if (!switchId || !uploadedAt) {
            return res
                .status(400)
                .json({ error: 'Switch ID and Uploaded Date are required.' })
        }

        // Parse the uploadedAt date string
        const uploadedDate = new Date(uploadedAt)
        if (isNaN(uploadedDate.getTime())) {
            return res
                .status(400)
                .json({ error: 'Invalid date format for uploadedAt.' })
        }

        // Create start and end of the day range
        const startOfDay = new Date(uploadedDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(uploadedDate.setHours(23, 59, 59, 999))

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

        console.log('Ledger fetched:', ledgers)

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
exports.getAccountById = async (req, res) => {
    try {
        const accountId = req.params.accountId
        const account = await Account.findById(accountId) // Assuming you are using Mongoose

        if (!account) {
            return res.status(404).json({ message: 'Account not found' })
        }

        res.json(account)
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

// Create Account

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
//             balanceAsPerLedgerDate,
//             balanceAsPerStatementDate,
//             accountCode,
//             accountClass,
//         } = req.body

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
        } = req.body

        // Check if an account with the same internalAccount, externalAccount, or accountTitle already exists
        const existingAccount = await Account.findOne({
            $or: [{ internalAccount }, { externalAccount }],
        })

        if (existingAccount) {
            return res.status(400).json({
                error: 'Account with the same internalAccount, externalAccount, ',
            })
        }

        // Proceed with creating the account if no duplicates are found
        const account = new Account({
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
            balanceAsPerLedger,
            balanceAsPerStmt,
            balanceAsPerLedgerDate,
            balanceAsPerStatementDate,
            accountCode,
            accountClass,
        })

        const savedAccount = await account.save()
        res.status(201).json(savedAccount)
    } catch (error) {
        console.error('Error creating account:', error) // Detailed logging
        res.status(500).json({
            error: 'Error creating account',
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

        console.log('Ledger fetched:', ledgers)

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

        console.log('Statements fetched:', statements)

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
