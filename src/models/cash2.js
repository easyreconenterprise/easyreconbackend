const mongoose = require('mongoose')

const cashSc33hema = new mongoose.Schema(
    {
        content30: String,
        content31: String,
        content32: String,
        content33: String,
        content34: String,
        content35: String,
        content36: String,
        content37: String,
        content38: String,
        content39: String,
        content40: String,
        content41: String,
        content42: String,
        content43: String,
        content44: String,
        content45: String,
        content46: String,
        content47: String,
        content48: String,
        content49: String,
        content50: String,
        content61: String,
        content62: String,
        content63: String,
        content64: String,
        content65: String,
        content66: String,
        content87: String,
        content108: String,
        content109: String,
        content89: String,
        content90: String,
        content91: String,
        content92: String,
        content93: String,
        content94: String,
        content95: String,
        content96: String,

        userId: {
            type: mongoose.Schema.Types.ObjectId, // Assuming your user IDs are ObjectIds
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

const CashMode3l = mongoose.model('Cas33h', cashSch33ema)

module.exports = CashMo33del
