'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');

const http = require('./http_controller');
const config = require('./config');
const webhooksConfig = config.webhook;
const logger = require('./logger');

exports.application = async (req, res, db) => {
    const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.applications });
    if (webhook) {
        const applications = await db.collection(config.DB.names.random_applications).find({}).toArray();
        const chosenApplication = applications[getRandomInt(0, applications.length)];
        fetch(webhook.url,
            {
                method: "POST",
                body: JSON.stringify(encrypt(chosenApplication, webhook.key)),
                headers: {
                    "Authorization": "token " + webhook.auth, 
                    "Content-Type": "application/json" 
                },
                timeout: webhooksConfig.timeout(false)
            })
            .then(_response => {
                logger.info("RANDOM APPLICATION - application has been sent.")
                return res.status(http.statuses.OK).send({ "success": true, "message": "Random application has been sent to your url." });
            }).catch(error => {
                logger.warning("RANDOM APPLICATION - send to specific url error: " + error.message);
                return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Some internal error." });
            })
        
    } else {
        logger.warning("RANDOM APPLICATION - no application webhook registered.")
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please register application webhook first." });
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function encrypt(application, key) {
    const body = {
        "application_id": application.application_id,
        "personal_id": application.personal_id,
        "name": application.name,
        "company_id": application.company_id,
        "company_name": application.company_name,
        "company_type": application.company_type,
        "amount": parseInt(application.amount, 10),
        "duration": parseInt(application.duration, 10),
        "purpose": application.purpose
    };
    const jsonPayload = JSON.stringify(body);
    const iv = crypto.randomBytes(16).toString('hex').substr(0,16);
    const encryptor = crypto.createCipheriv('AES-256-CBC', key, iv);
    const encrypted = encryptor.update(jsonPayload, 'utf8', 'base64') + encryptor.final('base64');
    return {
        "data": new Buffer.from(encrypted).toString('base64'),
        "iv": new Buffer.from(iv).toString('base64')
    }
}
