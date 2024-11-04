require('dotenv').config()

const DBURL =
    process.env.NODE_ENV === 'test'
        ? process.env.TESTDB_URL
        : process.env.DB_URL
const PORT = process.env.PORT || 5000

module.exports = {
    DBURL,
    PORT,
}
