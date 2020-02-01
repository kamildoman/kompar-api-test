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

// const jwt = require('jsonwebtoken');

// const ALGORITHM = "HS256";

// const claims = {
//     //iat:  Date.now()
// }

// const options = {
//     expiresIn: '60s',
//     algorithm:  ALGORITHM
// };

// const token = jwt.sign(claims, "secret", options);
// console.log(token);

// const options2 = {
//     algorithm:  ALGORITHM
// };

// const a = jwt.verify(token, "secret", options2);
// console.log(a);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 3000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 5000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 8000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 11000);

// setTimeout(function() {
//     try {
//         const aa = jwt.verify(token, "secret", options2);
//         console.log(aa);
//     } catch(error) {
//         console.log(error);
//     }
    
// }, 15000);

// setTimeout(function() {
//     try {
//         const aa = jwt.verify(token, "secret", options2);
//         console.log(aa);
//     } catch(error) {
//         console.log(error);
//     }
    
// }, 61000);