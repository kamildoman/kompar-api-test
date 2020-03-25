'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

const http = require('./http_controller');
const config = require('./config');
const webhooksConfig = config.webhook;
const logger = require('./logger');

exports.application = async (res, db) => {
    const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.applications });
    if (webhook) {
        const applications = await db.collection(config.DB.names.random.applications).find({}).toArray();
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
                logger.info(`RANDOM APPLICATION - application has been sent. Client id: ${res.locals.id}`)
                return res.status(http.statuses.OK).send({ "success": true, "message": "Random application has been sent to your url." });
            }).catch(error => {
                logger.warning(`RANDOM APPLICATION - send to specific url error: ${error.message}. Client id: ${res.locals.id}`);
                return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Some internal error." });
            })
        
    } else {
        logger.warning(`RANDOM APPLICATION - no application webhook registered. Client id: ${res.locals.id}`)
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

exports.decision = async (res, db) => {
    const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.decisions });
    if (webhook) {
        const decisions = await db.collection(config.DB.names.random.decisions).find({}).toArray();
        const chosenDecision = decisions[getRandomInt(0, decisions.length)];
        fetch(webhook.url,
            {
                method: "POST",
                body: JSON.stringify({
                    "application_id": chosenDecision.application_id,
                    "accepted": chosenDecision.accepted,
                    "email": chosenDecision.email,
                    "phone_number": chosenDecision.phone_number
                }),
                headers: {
                    "Authorization": "token " + webhook.auth, 
                    "Content-Type": "application/json" 
                },
                timeout: webhooksConfig.timeout(false)
            })
            .then(_response => {
                logger.info(`RANDOM DECISION - decision has been sent. Client id: ${res.locals.id}`)
                return res.status(http.statuses.OK).send({ "success": true, "message": "Random decision has been sent to your url." });
            }).catch(error => {
                logger.warning(`RANDOM DECISION - send to specific url error: ${error.message}. Client id: ${res.locals.id}`);
                return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Some internal error." });
            })
        
    } else {
        logger.warning(`RANDOM DECISION - no decision webhook registered. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please register decision webhook first." });
    }
}

function encrypt2(application, key) {
    const body = {
        "application_id": application.id,
        "personal_id": application.personal_id,
        "name": application.name,
        "company_id": application.business_id,
        "company_name": application.groupName,
        "company_type": application.entityType,
        "amount": parseInt(application.loanAmount, 10),
        "duration": parseInt(application.desiredTerm, 10),
        "purpose": application.loanPurpose
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

exports.flowStart = async (res, db) => {
    const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.applications });
    if (webhook) {
        const application_id = uuidv4();
        try {
            await db.collection(config.DB.names.clients).updateOne({ id: res.locals.id }, {
                $set: {
                    flow: {
                        application_id: application_id                    
                    }
                }
            });
            const app = randomApp(application_id, res.locals.id);
            await db.collection(config.DB.names.applications).updateOne(
                { lender_id: res.locals.id }, 
                { 
                    $set: {
                        id: app.application_id,
                        personal_id: app.personal_id,
                        name: app.name,
                        business_id: app.company_id,
                        groupName: app.company_name,
                        entityType: app.company_type,
                        loanAmount: app.amount,
                        desiredTerm: app.duration,
                        loanPurpose: app.purpose,
                        lender_id: app.lender_id
                    } 
                },
                { upsert : true }
            );
            logger.info(`FLOW START - correctly. Client id: ${res.locals.id}`)
            return res.status(http.statuses.OK).send({ "success": true, "message": "New flow has been started." });
        } catch(error) {
            logger.error(`FLOW START - error: ${error.message}. Client id: ${res.locals.id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Some internal error." });
        }
    } else {
        logger.warning(`FLOW START - no application webhook registered. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "To start flow you have to register application webhook first." });
    }
}

function randomApp(application_id, lender_id) {
    const all = [
        {
            application_id: application_id,
            personal_id: "5104114458",
            name: "Adnan Ivarsson",
            company_id: "5554443332",
            company_name: "TEST COMPANY",
            company_type: "AB",
            amount: 10000,
            duration: 36,
            purpose: "Övrigt",
            lender_id: lender_id
        },
        {
            application_id: application_id,
            personal_id: "5611250555",
            name: "Malte Lindqvist",
            company_id: "1112229990",
            company_name: "TEST COMPANY2",
            company_type: "KB",
            amount: 7000000,
            duration: 36,
            purpose: "Säsongsinvestering",
            lender_id: lender_id
        },
        {
            application_id: application_id,
            personal_id: "4201081207",
            name: "Adriana Söderberg",
            company_id: "0001112223",
            company_name: "TEST COMPANY3",
            company_type: "HB",
            amount: 1000000,
            duration: 12,
            purpose: "Omfinansiering av lån / samla lån",
            lender_id: lender_id
        },
        {
            application_id: application_id,
            personal_id: "9309038306",
            name: "Vanesa Johansson",
            company_id: "9990001113",
            company_name: "TEST COMPANY4",
            company_type: "AB",
            amount: 22000,
            duration: 16,
            purpose: "Renovering",
            lender_id: lender_id
        },
        {
            application_id: application_id,
            personal_id: "8010080813",
            name: "Timmie Persson",
            company_id: "4445557772",
            company_name: "TEST COMPANY5",
            company_type: "AB",
            amount: 55555,
            duration: 18,
            purpose: "Inköp av lager",
            lender_id: lender_id
        }
    ]
    return all[getRandomInt(0, all.length)];
}

exports.flowApplication = async (res, db) => {
    const application = await db.collection(config.DB.names.applications).findOne({ lender_id: res.locals.id });
    if (!application) {
        logger.warning(`FLOW APPLICATION - no application. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to start flow first." });
    } else {
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.applications });
        if (webhook) {
            fetch(webhook.url,
                {
                    method: "POST",
                    body: JSON.stringify(encrypt2(application, webhook.key)),
                    headers: {
                        "Authorization": "token " + webhook.auth, 
                        "Content-Type": "application/json" 
                    },
                    timeout: webhooksConfig.timeout(false)
                })
                .then(_response => {
                    logger.info(`FLOW APPLICATION - application has been sent. Client id: ${res.locals.id}`)
                    return res.status(http.statuses.OK).send({ "success": true, "message": "Application has been sent to your url." });
                }).catch(error => {
                    logger.warning(`FLOW APPLICATION - send to specific url error: ${error.message}. Client id: ${res.locals.id}`);
                    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Some internal error." });
                })
        } else {
            logger.warning(`FLOW APPLICATION - no application webhook registered. Client id: ${res.locals.id}`)
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "No application webhook created." });
        }
    }
};