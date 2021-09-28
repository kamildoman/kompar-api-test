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
        const chosenApplication = randomApp(uuidv4(), res.locals.id);
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
        "company_revenue": parseFloat(application.company_revenue),
        "company_age": parseFloat(application.company_age),
        "amount": parseInt(application.amount, 10),
        "duration": parseInt(application.duration, 10),
        "purpose": application.purpose
    };
    const jsonPayload = JSON.stringify(body);
    const iv = crypto.randomBytes(16).toString('hex').substr(0,16);
    const encryptor = crypto.createCipheriv('AES-256-CBC', key, iv);
    const encrypted = encryptor.update(jsonPayload, 'utf8', 'base64') + encryptor.final('base64');
    return {
        "data": encrypted,
        "iv": new Buffer.from(iv, "hex").toString('base64')
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
        "company_revenue": parseFloat(application.revenue),
        "company_age": parseFloat(application.yrsBusiness),
        "amount": parseInt(application.loanAmount, 10),
        "duration": parseInt(application.desiredTerm, 10),
        "purpose": application.loanPurpose
    };
    const jsonPayload = JSON.stringify(body);
    const iv = crypto.randomBytes(16).toString('hex').substr(0,16);
    const encryptor = crypto.createCipheriv('AES-256-CBC', key, iv);
    const encrypted = encryptor.update(jsonPayload, 'utf8', 'base64') + encryptor.final('base64');
    return {
        "data": encrypted,
        "iv": new Buffer.from(iv, "hex").toString('base64')
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
            await db.collection(config.DB.names.client).insert(
                {
                    "id": uuidv4(),
                    "applications":[
                        {
                            id: app.application_id,
                            personal_id: app.personal_id,
                            name: app.name,
                            business_id: app.company_id,
                            groupName: app.company_name,
                            entityType: app.company_type,
                            revenue: app.company_revenue,
                            yrsBusiness: app.company_age,
                            loanAmount: app.amount,
                            desiredTerm: app.duration,
                            loanPurpose: app.purpose,
                            company_last_year_revenue: app.company_last_year_revenue,
                            company_description: app.company_description,
                            lender_id: app.lender_id,
                            mobilePhone1: app.mobilePhone1,
                            emailAddress: app.emailAddress,
                            offers: []
                        }
                    ]
                }
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
            company_revenue: 100.0,
            company_age: 1.9,
            amount: 10000,
            duration: 36,
            purpose: "Övrigt",
            company_last_year_revenue: 90000.0,
            company_description: "Any description",
            lender_id: lender_id,
            mobilePhone1: "123456789",
            emailAddress: "adman98129833@EMAIL.com"
        },
        {
            application_id: application_id,
            personal_id: "5611250555",
            name: "Malte Lindqvist",
            company_id: "1112229990",
            company_name: "TEST COMPANY2",
            company_type: "KB",
            company_revenue: 10044.0,
            company_age: 6.1,
            amount: 7000000,
            duration: 36,
            purpose: "Säsongsinvestering",
            company_last_year_revenue: 45555.0,
            company_description: "Some description",
            lender_id: lender_id,
            mobilePhone1: "333222111",
            emailAddress: "malte12355111@EMAIL.com"
        },
        {
            application_id: application_id,
            personal_id: "4201081207",
            name: "Adriana Söderberg",
            company_id: "0001112223",
            company_name: "TEST COMPANY3",
            company_type: "HB",
            company_revenue: 4311.0,
            company_age: 41.8,
            amount: 1000000,
            duration: 12,
            purpose: "Omfinansiering av lån / samla lån",
            company_last_year_revenue: -1.0,
            company_description: "blank",
            lender_id: lender_id,
            mobilePhone1: "987654321",
            emailAddress: "adriana000999333@EMAIL.com"
        },
        {
            application_id: application_id,
            personal_id: "9309038306",
            name: "Vanesa Johansson",
            company_id: "9990001113",
            company_name: "TEST COMPANY4",
            company_type: "AB",
            company_revenue: 78999.0,
            company_age: 4.7,
            amount: 22000,
            duration: 16,
            purpose: "Renovering",
            company_last_year_revenue: -1.0,
            company_description: "blank",
            lender_id: lender_id,
            mobilePhone1: "999999999",
            emailAddress: "vanesa123511@EMAIL.com"
        },
        {
            application_id: application_id,
            personal_id: "8010080813",
            name: "Timmie Persson",
            company_id: "4445557772",
            company_name: "TEST COMPANY5",
            company_type: "AB",
            company_revenue: 120000.0,
            company_age: 7.2,
            amount: 55555,
            duration: 18,
            purpose: "Inköp av lager",
            company_last_year_revenue: -1.0,
            company_description: "blank",
            lender_id: lender_id,
            mobilePhone1: "777888999",
            emailAddress: "timmie123844@EMAIL.com"
        }
    ]
    return all[getRandomInt(0, all.length)];
}

exports.flowApplication = async (res, db) => {
    const client = await db.collection(config.DB.names.clients).findOne({ id: res.locals.id });
    if (!client.flow || !client.flow.application_id) {
        logger.warning(`FLOW APPLICATION - no flow started. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to start flow first." });
    }

    const clients = await db.collection(config.DB.names.client).findOne({ "applications.id": client.flow.application_id });
    if (!clients) {
        logger.warning(`FLOW APPLICATION - no application. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to start flow first." });
    }
    const application = clients.applications[0];

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
};

exports.flowDecision = async (res, db) => {
    const application = await db.collection(config.DB.names.applications).findOne({ lender_id: res.locals.id });
    if (!application) {
        logger.warning(`FLOW DECISION - no application. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to start flow first." });
    } else if (!application.offers[0]) {
        logger.warning(`FLOW DECISION - no offer for application. Client id: ${res.locals.id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "To get decision you have to add offer first." });
    } else {
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: res.locals.id, type: webhooksConfig.type.decisions });
        if (!webhook) {
            logger.warning(`FLOW DECISION - no decision webhook. Client id: ${res.locals.id}`)
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to register decision webhook first." });
        } else {
            const body = {
                "application_id": application.id
            };
            var accepted = false;
            if (getRandomInt(0, 2) == 1) {
                accepted = true;
            }
            if (accepted) {
                body["accepted"] = true;
                body["email"] = application.emailAddress;
                body["phone_number"] = application.mobilePhone1; 
            } else {
                body["accepted"] = false;
            }

            await db.collection(config.DB.names.applications).updateOne({ lender_id: res.locals.id }, {
                $set: {
                    sentDecisionViaWebhook: true,
                    chosenLender: res.locals.id
                }
            });

            fetch(webhook.url,
                {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: {
                        "Authorization": "token " + webhook.auth, 
                        "Content-Type": "application/json" 
                    },
                    timeout: webhooksConfig.timeout(false)
                })
                .then(_response => {
                    logger.info(`FLOW DECISION - decision has been sent. Client id: ${res.locals.id}`)
                    return res.status(http.statuses.OK).send({ "success": true, "message": "Decision has been sent to your url." });
                }).catch(error => {
                    logger.warning(`FLOW DECISION - internal error ${error}. Client id: ${res.locals.id}`)
                    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Internal error." });
                })
        }
    }
};