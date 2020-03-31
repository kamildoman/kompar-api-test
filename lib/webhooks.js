'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');

const http = require('./http_controller');
const config = require('./config');
const webhooksConfig = config.webhook;
const logger = require('./logger');

exports.applicationsPost = async function(req, res, db) {
    const body = req.body;
    const id = res.locals.id;
    if (config.common.hasOwnProperty(body, config.common.property.url)) {
        const url = body.url;
        if (typeof(url) !== "string") {
            logger.warning(`WEBHOOKS - APPLICATION POST - Url is not string. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Url has to be string." });
        } else if (!config.common.isUrlValid(url)) {
            logger.warning(`WEBHOOKS - APPLICATION POST - Not valid url. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use valid url." });
        } else if (!config.common.isUrlHttps(url)) {
            logger.warning(`WEBHOOKS - APPLICATION POST - Not https protocol. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use https protocol." });
        } else {
            try {
                const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.applications });
                if (webhook) {
                    logger.warning(`WEBHOOKS - APPLICATION POST - Webhook already registered. Client id: ${id}`);
                    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have already registered applications webhook." });
                } else {
                    const key = res.locals.key;
                    const auth = res.locals.auth;
                    await db.collection(config.DB.names.webhooks).insertOne({
                        client_id: id,
                        type: webhooksConfig.type.applications,
                        url: url,
                        key: key,
                        auth: auth
                    })
                    logger.info(`WEBHOOKS - APPLICATION POST - Webhook created correctly, Client id: ${id}`);
                    return res.status(http.statuses.OK).send({ "success": true });
                }
            } catch (error) {
                logger.error(`WEBHOOKS - APPLICATION POST - Mongo error ${error}. Client id: ${id}`);
                return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
            }
        }
    } else {
        logger.warning(`WEBHOOKS - APPLICATION POST - No url. Client id: ${id}`)
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide url." });
    }
}

exports.applicationsDelete = async function(res, db) {
    const id = res.locals.id;
    try {
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.applications });
        if (!webhook) {
            logger.warning(`WEBHOOKS - APPLICATION DELETE - webhook for this client not registered yet. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You don't have registered applications webhook." });
        } else {
            await db.collection(config.DB.names.webhooks).deleteOne({ client_id: id, type: webhooksConfig.type.applications });
            logger.info(`WEBHOOKS - APPLICATION DELETE - webhook has been deleted. Client id: ${id}`);
            return res.status(http.statuses.OK).send({ "success": true });
        }
    } catch (error) {
        logger.error(`WEBHOOKS - APPLICATION DELETE - Mongo error ${error}. Client id: ${id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

exports.sendApplicationToLenders = async function(req, res, db, test) {
    const id = req.body.id;
    const headers = req.headers;
    const authorization = headers.authorization;
    const token = authorization.split(" ")[1];
    if (id != null && id != undefined && token != null && token != undefined && token === process.env.SEND_APPLICATION_TO_API_AUTH) {
        try {
            const application = await db.collection(config.DB.names.applications).findOne({ id: id });
            if (!application) {
                logger.warning("WEBHOOKS - SEND TO LENDERS - not application with this id.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Application with this id doesn't exist." });
            } else if (application.sentViaWebhook != null && application.sentViaWebhook != undefined && application.sentViaWebhook) {
                logger.warning("WEBHOOKS - SEND TO LENDERS - already sent.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Application with this id has been already sent via webhook." });
            } else {
                const sent = [];
                const webhooks = await db.collection(config.DB.names.webhooks).find( { type: webhooksConfig.type.applications}).toArray();
                const promises = [];
                webhooks.forEach(function(webhook) {
                    const promise = fetch(webhook.url,
                        {
                            method: "POST",
                            body: JSON.stringify(encrypt(application, webhook.key)),
                            headers: {
                                "Authorization": "token " + webhook.auth, 
                                "Content-Type": "application/json" 
                            },
                            timeout: webhooksConfig.timeout(test)
                        })
                        .then(response => {
                            if (response.status === 200) {
                                sent.push({ "webhook": webhook, "confirmed": true, "after_resend_not_confirmed": false });
                            } else {
                                sent.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false });
                            }
                        }).catch(error => {
                            logger.warning("WEBHOOKS - SEND TO LENDERS - send to specific url error: " + error.message);
                            sent.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false });
                        })
                    promises.push(promise);
                });
                return Promise.all(promises)
                    .then(async () => {
                        await db.collection(config.DB.names.applications).updateOne({ id: id }, {
                            $set: {
                                sentViaWebhook: true,
                                webhooks: shortSent(sent)
                            }
                        });
                        loop(application, sent, db, test);
                        logger.info(`WEBHOOKS - SEND TO LENDERS - Application ${id} has been sent to lenders via webhook. Sent to: ${JSON.stringify(sent)}.`);
                        return res.status(http.statuses.OK).send({ "success": true, "message": `Application ${id} has been sent to lenders via webhook.` });
                    }).catch((error) => {
                        logger.error(`WEBHOOKS - SEND TO LENDERS - PROMISE error: ${error}`);
                        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
                    })
            }
        } catch (error) {
            logger.error(`WEBHOOKS - SEND TO LENDERS - MONGO error: ${error}`);
            return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
        }
    } else {
        logger.warning("WEBHOOKS - SEND TO LENDERS - no application id in body or token unauthorized.");
        return res.status(http.statuses.OK).send({ "success": false, "message": "You have to provide application id and authorization." });
    }
}

function shortSent(sent) {
    const short = [];
    for (var i = 0; i < sent.length; i++) {
        short.push({
            "_id": sent[i].webhook._id,
            "client_id": sent[i].webhook.client_id,
            "url": sent[i].webhook.url,
            "confirmed": sent[i].confirmed,
            "after_resend_not_confirmed": sent[i].after_resend_not_confirmed
        })
    }
    return short;
}

function encrypt(application, key) {
    const body = {
        "application_id": application.id,
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
    if (application.last_year_revenue > -1.0) {
        body["last_year_revenue"] = application.last_year_revenue;
    }
    if (application.company_description != "blank") {
        body["company_description"] = application.company_description;
    }
    const jsonPayload = JSON.stringify(body);
    const iv = crypto.randomBytes(16).toString('hex').substr(0,16);
    const encryptor = crypto.createCipheriv('AES-256-CBC', key, iv);
    const encrypted = encryptor.update(jsonPayload, 'utf8', 'base64') + encryptor.final('base64');
    return {
        "data": new Buffer.from(encrypted).toString('base64'),
        "iv": new Buffer.from(iv).toString('base64')
    }
}

async function loop(application, sent, db, test) {
    var times = [
        30000,    // 30000       30 seconds
        120000,   // 120000      2 minutes
        900000,   // 900000      15 minutes
        3600000   // 3600000     1 hour
    ]
    if (test) {
        times = [
            1000,   
            1000,
            1000,
            1000
        ]
    }
    for (var i = 0; i < sent.length; i++) {
        sent[i]["current"] = 0;
        if (!sent[i].confirmed) {
            timeout(i, sent, times, application, db, test);
        }
    }
}

async function timeout(i, sent, times, application, db, test) {
    if (sent[i]["current"] < times.length) {
        setTimeout(async function() {
            logger.info("Resent webhook: " + JSON.stringify(sent[i].webhook));
            fetch(sent[i].webhook.url,
                {
                    method: "POST",
                    body: JSON.stringify(encrypt(application, sent[i].webhook.key)),
                    headers: {
                        "Authorization": "token " + sent[i].webhook.auth, 
                        "Content-Type": "application/json" 
                    },
                    timeout: webhooksConfig.timeout(test)
                })
                .then(async res => {
                    if (res.status === 200) {
                        logger.info(`WEBHOOKS - RESEND TO LENDER: ${sent[i].webhook.client_id} - confirmed"`);
                        sent[i].confirmed = true;
                        await db.collection(config.DB.names.applications).updateOne(
                            { 
                                id: application.id,
                                "webhooks._id": sent[i].webhook._id
                            }, {
                            $set: {
                                "webhooks.$.confirmed": true
                            }
                        });
                    } else {
                        sent[i].confirmed = false;
                        sent[i]["current"] = sent[i]["current"] + 1;
                        timeout(i, sent, times, application, db, test);
                    }
                }).catch(error => {
                    logger.warning("WEBHOOKS - RESEND TO LENDERS - send to specific url error: " + error.message);
                    sent[i].confirmed = false;
                    sent[i]["current"] = sent[i]["current"] + 1;
                    timeout(i, sent, times, application, db, test);
                })
        }, times[sent[i]["current"]]);
    } else {
        logger.warning(`WEBHOOKS - RESEND TO LENDERS - finally not confirmed: application_id: ${application.id}`);
        await db.collection(config.DB.names.applications).updateOne(
            { 
                id: application.id,
                "webhooks._id": sent[i].webhook._id
            }, {
            $set: {
                "webhooks.$.after_resend_not_confirmed": true
            }
        });
    }
}

exports.decisionsPost = async function(req, res, db) {
    const body = req.body;
    const id = res.locals.id;
    if (config.common.hasOwnProperty(body, config.common.property.url)) {
        const url = body.url;
        if (typeof(url) !== "string") {
            logger.warning(`WEBHOOKS - APPLICATION POST - Url is not string. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Url has to be string." });
        } else if (!config.common.isUrlValid(url)) {
            logger.warning(`WEBHOOKS - DECISIONS POST - Not valid url. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use valid url." });
        } else if (!config.common.isUrlHttps(url)) {
            logger.warning(`WEBHOOKS - DECISIONS POST - Not https protocol. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use https protocol." });
        } else {
            try {
                const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.decisions });
                if (webhook) {
                    logger.warning(`WEBHOOKS - DECISIONS POST - Webhook already registered. Client id: ${id}`);
                    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have already registered decisions webhook." });
                } else {
                    const auth = res.locals.auth;
                    await db.collection(config.DB.names.webhooks).insertOne({
                        client_id: id,
                        type: webhooksConfig.type.decisions,
                        url: url,
                        auth: auth
                    })
                    logger.info(`WEBHOOKS - DECISIONS POST - Webhook created correctly, Client id: ${id}`);
                    return res.status(http.statuses.OK).send({ "success": true });
                }
            } catch (error) {
                logger.error(`WEBHOOKS - DECISIONS POST - Mongo error ${error}. Client id: ${id}`);
                return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
            }
        }
    } else {
        logger.warning("WEBHOOKS - DECISIONS POST - No url.")
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide url." });
    }
}

exports.decisionsDelete = async function(res, db) {
    const id = res.locals.id;
    try {
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.decisions });
        if (!webhook) {
            logger.warning(`WEBHOOKS - DECISIONS DELETE - webhook for this client not registered yet. Client id: ${id}`);
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You don't have registered decisions webhook." });
        } else {
            await db.collection(config.DB.names.webhooks).deleteOne({ client_id: id, type: webhooksConfig.type.decisions });
            logger.info(`WEBHOOKS - DECISIONS DELETE - webhook has been deleted. Client id: ${id}`);
            return res.status(http.statuses.OK).send({ "success": true });
        }
    } catch (error) {
        logger.error(`WEBHOOKS - DECISIONS DELETE - Mongo error ${error}. Client id: ${id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

exports.sendDecisionToLenders = async function(req, res, db, test) {
    const id = req.body.id;
    const lender_id_from_bubble = req.body.lender_id;
    if (id != null && lender_id_from_bubble != null) {
        try {
            const application = await db.collection(config.DB.names.applications).findOne({ id: id });
            if (!application) {
                logger.warning("WEBHOOKS - SEND DECISON TO LENDERS - not application with this id.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Application with this id doesn't exist." });
            } else if (application.sentDecisionViaWebhook != null && application.sentDecisionViaWebhook != undefined && application.sentDecisionViaWebhook) {
                logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - already sent.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Decision for this application has been already sent via webhook." });
            } else {
                const sent = [];
                const webhooks = await db.collection(config.DB.names.webhooks).find( { type: webhooksConfig.type.decisions}).toArray();
                const promises = [];
                const offers = application.offers;
                webhooks.forEach(function(webhook) {
                    for (var i = 0; i < offers.length; i++) {
                        const offer = offers[i];
                        if (offer.lender_id === webhook.client_id) {
                            const body = {
                                "application_id": application.id
                            };
                            if (offer.lender_id === lender_id_from_bubble) {
                                body["accepted"] = true;
                                body["email"] = application.emailAddress;
                                body["phone_number"] = application.mobilePhone1; 
                            } else {
                                body["accepted"] = false;
                            }
                            if (offer.is_offer_available) {
                                const promise = fetch(webhook.url,
                                    {
                                        method: "POST",
                                        body: JSON.stringify(body),
                                        headers: {
                                            "Authorization": "token " + webhook.auth, 
                                            "Content-Type": "application/json" 
                                        },
                                        timeout: webhooksConfig.timeout(test)
                                    })
                                    .then(response => {
                                        if (response.status === 200) {
                                            sent.push({ "webhook": webhook, "confirmed": true, "after_resend_not_confirmed": false });
                                        } else {
                                            sent.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false });
                                        }
                                    }).catch(error => {
                                        logger.warning("WEBHOOKS - SEND TO LENDERS - send to specific url error: " + error.message);
                                        sent.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false });
                                    })
                                promises.push(promise);
                            }
                        }
                    }
                });
                return Promise.all(promises)
                    .then(async () => {
                        await db.collection(config.DB.names.applications).updateOne({ id: id }, {
                            $set: {
                                sentDecisionViaWebhook: true,
                                decision_webhooks: shortSent(sent),
                                chosenLender: lender_id_from_bubble
                            }
                        });
                        loopDecision(application, sent, db, test, lender_id_from_bubble);
                        logger.info(`WEBHOOKS DECISION - SEND TO LENDERS - Application ${id} has been sent to lenders via webhook. Sent to: ${JSON.stringify(sent)}.`);
                        return res.status(http.statuses.OK).send({ "success": true, "message": `Application ${id} has been sent to lenders via webhook.` });
                    }).catch((error) => {
                        logger.error(`WEBHOOKS DECISION - SEND TO LENDERS - PROMISE error: ${error}`);
                        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
                    })
            }
        } catch (error) {
            logger.error(`WEBHOOKS - SEND DECISIONS TO LENDERS - MONGO error: ${error}`);
            return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
        }
    }
    logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - no application id or lender id in body.");
    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide application id and lender id." });
}

async function loopDecision(application, sent, db, test, lender_id_from_bubble) {
    var times = [
        30000,    // 30000       30 seconds
        120000,   // 120000      2 minutes
        900000,   // 900000      15 minutes
        3600000   // 3600000     1 hour
    ]
    if (test) {
        times = [
            1000,   
            1000,
            1000,
            1000
        ]
    }
    for (var i = 0; i < sent.length; i++) {
        sent[i]["current"] = 0;
        if (!sent[i].confirmed) {
            timeoutDecision(i, sent, times, application, db, test, lender_id_from_bubble);
        }
    }
}

async function timeoutDecision(i, sent, times, application, db, test, lender_id_from_bubble) {
    if (sent[i]["current"] < times.length) {
        setTimeout(async function() {
            logger.info("Resent webhook DECISION: " + JSON.stringify(sent[i].webhook));
            const offers = application.offers;
            for (var j = 0; j < offers.length; j++) {
                const offer = offers[j];
                if (offer.lender_id == sent[i].webhook.client_id) {
                    const body = {
                        "application_id": application.id
                    };
                    if (offer.lender_id == lender_id_from_bubble) {
                        body["accepted"] = true;
                        body["email"] = application.emailAddress;
                        body["phone_number"] = application.mobilePhone1; 
                    } else {
                        body["accepted"] = false;
                    }
                    fetch(sent[i].webhook.url,
                        {
                            method: "POST",
                            body: JSON.stringify(body),
                            headers: {
                                "Authorization": "token " + sent[i].webhook.auth, 
                                "Content-Type": "application/json" 
                            },
                            timeout: webhooksConfig.timeout(test)
                        })
                        .then(async res => {
                            if (res.status === 200) {
                                logger.info(`WEBHOOKS DECISION - RESEND TO LENDER: ${sent[i].webhook.client_id} - confirmed"`);
                                sent[i].confirmed = true;
                                await db.collection(config.DB.names.applications).updateOne(
                                    { 
                                        id: application.id,
                                        "decision_webhooks._id": sent[i].webhook._id
                                    }, {
                                    $set: {
                                        "decision_webhooks.$.confirmed": true
                                    }
                                });
                            } else {
                                sent[i].confirmed = false;
                                sent[i]["current"] = sent[i]["current"] + 1;
                                timeoutDecision(i, sent, times, application, db, test, lender_id_from_bubble);
                            }
                        }).catch(error => {
                            logger.warning("WEBHOOKS DECISION - RESEND TO LENDERS - send to specific url error: " + error.message);
                            sent[i].confirmed = false;
                            sent[i]["current"] = sent[i]["current"] + 1;
                            timeoutDecision(i, sent, times, application, db, test, lender_id_from_bubble);
                        })
                }
            }
        }, times[sent[i]["current"]]);
    } else {
        logger.warning(`WEBHOOKS DECISION - RESEND TO LENDERS - finally not confirmed: application_id: ${application.id}`);
        await db.collection(config.DB.names.applications).updateOne(
            { 
                id: application.id,
                "decision_webhooks._id": sent[i].webhook._id
            }, {
            $set: {
                "decision_webhooks.$.after_resend_not_confirmed": true
            }
        });
    }
}