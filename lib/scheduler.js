// @ts-check

'use strict';

const http = require("http");
const agent = new http.Agent({
    keepAlive: true,
    rejectUnauthorized: false
})
const test = !process.env.PRODUCTION_ENVIRONMENT;
const options = { method: 'GET' };
if (test) {
    options["agent"] = agent;
}
////////

const fetch = require('node-fetch');
const logger = require('./logger');
const config = require('./config');

function run() {
    fetch(config.scheduler_url(test),
        options
    )
    .then(res => res.json())
    .then(res => {
        if (res.howManyStarted > 0) {
            logger.info(`Scheduler started ${res.howManyStarted} tasks`);
        }
    })
    .catch(error => {
        logger.error(`Scheduler error: ${error}`);
    });
}

run();