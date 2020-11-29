'use strict';

const app = require('./lib/app');
const config = require('./lib/config');
const logger = require('./lib/logger');

(async () => {
    try {
        const port = config.PORT;
        const server = app.listen(port, () => {
            logger.info(`App listening on port: ${port}`);
        });
        server.on('error', (error) => {
            logger.error(error.message || error);
            process.exit(1);
        });
    } catch (error) {
      logger.error(error.message || error);
      process.exit(2);
    }
})();