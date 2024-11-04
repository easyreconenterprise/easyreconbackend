// module.exports = CategorizedDataModel
const mongoose = require('mongoose')

const categorizedDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },
    subcategory: {
        Asset: {
            'Non-current': {
                'Property plant and equipment': [],
                'Deferred tax assets': [],
                Investment: [],
                'Other receivables': [],
                'Intangible assets and good will': [],
                'Biological assets': [],
                'Investment property': [],
            },
            Current: {
                Inventories: [],
                'Trade and other receivables': [],
                'prepayment and advances': [],
                'Cash and cash equivalent': [],
            },
        },
        'Equity and Liability': {
            'Non-current-Liability': {
                'Deferred Income': [],
                Provision: [],
                'Deferred tax liability': [],
                'Trade and other payables': [],
                'Loans and borrowings': [],
            },
            'Current-liability': {
                'Bank Overdraft': [],
                'Current tax liabilities': [],
                'Deferred Incomes': [],
                'Loans and borrowing': [],
                'Trade and other payable': [],
            },
            Equity: {
                'Capital and reserves': [],
                'Share capital': [],
                'Retained earnings': [],
                Reserves: [],
                'Share Premium': [],
            },
        },
        Income: {
            Revenue: [],
            'Cost of sales': [],
            'Other income': [],
            'Administrative and selling expenses': [],
            'Impairment loss on trade receivables': [],
            'Finance income': [],
            'Finance cost': [],
            'Minimum tax expense': [],
            Taxation: [],
            'Loss from discontinued operations': [],
        },
    },
})

const CategorizedDataModel = mongoose.model(
    'CategorizedData',
    categorizedDataSchema
)

module.exports = CategorizedDataModel
