const { app } = require('../app');
const { logger } = require('../src/utils/logger');
const CONFIG = require('./env')
var PORT = CONFIG.PORT

/* Handling unhandled exception */
process.on("unhandledException", (err) => {
    logger.error("Unhandled Exception:", err);
    process.exit(1);
});


/* starting server */
var server = app.listen(PORT, ()=> {
    logger.info(`server is running on http://localhost:${PORT} `)
})

/* Handling unhandled rejection */
process.on("unhandledRejection", (err) => {
    logger.info("Unhandled Rejection! ...Shutting down....");
    logger.error(`Error: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});


