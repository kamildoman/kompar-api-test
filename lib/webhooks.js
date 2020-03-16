'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');

const http = require('./http_controller');
const config = require('./config');
const webhooksConfig = config.webhook;
const logger = require('./logger');

exports.applicationsPost = async function(req, res, db) {
    const body = req.body;
    if (config.common.hasOwnProperty(body, config.common.property.url)) {
        const url = body.url;
        if (!config.common.isUrlValid(url)) {
            logger.warning("WEBHOOKS - APPLICATION POST - Not valid url.")
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use valid url." });
        } else if (!config.common.isUrlHttps(url)) {
            logger.warning("WEBHOOKS - APPLICATION POST - Not https protocol.")
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use https protocol." });
        } else {
            try {
                const id = res.locals.id;
                const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.applications });
                if (webhook) {
                    logger.warning("WEBHOOKS - APPLICATION POST - Webhook already registered.")
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
                    logger.info(`WEBHOOKS - APPLICATION POST - Webhook created correctly, client id: ${id}`);
                    return res.status(http.statuses.OK).send({ "success": true });
                }
            } catch (error) {
                logger.error(`WEBHOOKS - APPLICATION POST - Mongo error ${error}`)
                return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
            }
        }
    } else {
        logger.warning("WEBHOOKS - APPLICATION POST - No url.")
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide url." });
    }
}

exports.applicationsDelete = async function(res, db) {
    try {
        const id = res.locals.id;
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.applications });
        if (!webhook) {
            logger.warning("WEBHOOKS - APPLICATION DELETE - webhook for this client not registered yet.");
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You don't have registered applications webhook." });
        } else {
            await db.collection(config.DB.names.webhooks).deleteOne({ client_id: id, type: webhooksConfig.type.applications });
            logger.info("WEBHOOKS - APPLICATION DELETE - webhook has been deleted.");
            return res.status(http.statuses.OK).send({ "success": true });
        }
    } catch (error) {
        logger.error(`WEBHOOKS - APPLICATION DELETE - Mongo error ${error}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

exports.sendApplicationToLenders = async function(req, res, db) {
    const id = req.body.id;
    if (id != null) {
        try {
            const application = await db.collection(config.DB.names.applications).findOne({ id: id });
            if (!application) {
                logger.warning("WEBHOOKS - SEND TO LENDERS - not application with this id.");
                return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Application with this id doesn't exist." });
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
                            timeout: webhooksConfig.timeout()
                        })
                        .then(response => {
                            if (response.status === 200) {
                                sent.push({ "webhook": webhook, "confirmed": true });
                            } else {
                                sent.push({ "webhook": webhook, "confirmed": false });
                            }
                        }).catch(error => {
                            logger.warning("WEBHOOKS - SEND TO LENDERS - send to specific url error: " + error.message);
                            sent.push({ "webhook": webhook, "confirmed": false });
                        })
                    promises.push(promise);
                })
                return Promise.all(promises)
                    .then(async () => {
                        await db.collection(config.DB.names.applications).updateOne({ id: id }, {
                            $set: {
                                webhooks: sent
                            }
                        });
                        loop(application, sent, db);
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
    }
    logger.warning("WEBHOOKS - SEND TO LENDERS - no application id in body.");
    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide application id." });
}

function encrypt(application, key) {
    const body = {
        "id": application.id,
        "name": application.name,
        "email": application.emailAddress
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

async function loop(application, sent, db) {
    var times = [
        30000,    // 30000       30 seconds
        12000,    // 120000      2 minutes
        900000,   // 900000      15 minutes
        3600000   // 3600000     1 hour
    ]
    if (process.env.AUTOMATIC_TESTING == 1) {
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
            timeout(i, sent, times, application, db);
        }
    }
}

async function timeout(i, sent, times, application, db) {
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
                    timeout: webhooksConfig.timeout()
                })
                .then(async res => {
                    if (res.status === 200) {
                        logger.info("WEBHOOKS - RESEND TO LENDERS - confirmed");
                        sent[i].confirmed = true;
                        await db.collection(config.DB.names.applications).updateOne(
                            { 
                                id: application.id,
                                "webhooks.webhook._id": sent[i].webhook._id
                            }, {
                            $set: {
                                "webhooks.$.confirmed": true
                            }
                        });
                    } else {
                        sent[i].confirmed = false;
                        sent[i]["current"] = sent[i]["current"] + 1;
                        timeout(i, sent, times, application, db);
                    }
                }).catch(error => {
                    logger.warning("WEBHOOKS - RESEND TO LENDERS - send to specific url error: " + error.message);
                    sent[i].confirmed = false;
                    sent[i]["current"] = sent[i]["current"] + 1;
                    timeout(i, sent, times, application, db);
                })
        }, times[sent[i]["current"]]);
    } else {
        await db.collection(config.DB.names.applications).updateOne(
            { 
                id: application.id,
                "webhooks.webhook._id": sent[i].webhook._id
            }, {
            $set: {
                "webhooks.$.after_resend_not_confirmed": true
            }
        });
    }
}

exports.decisionsPost = async function(req, res, db) {
    const body = req.body;
    if (config.common.hasOwnProperty(body, config.common.property.url)) {
        const url = body.url;
        if (!config.common.isUrlValid(url)) {
            logger.warning("WEBHOOKS - DECISIONS POST - Not valid url.")
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use valid url." });
        } else if (!config.common.isUrlHttps(url)) {
            logger.warning("WEBHOOKS - DECISIONS POST - Not https protocol.")
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "Please use https protocol." });
        } else {
            try {
                const id = res.locals.id;
                const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.decisions });
                if (webhook) {
                    logger.warning("WEBHOOKS - DECISIONS POST - Webhook already registered.")
                    return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have already registered decisions webhook." });
                } else {
                    const key = res.locals.key;
                    await db.collection(config.DB.names.webhooks).insertOne({
                        client_id: id,
                        type: webhooksConfig.type.decisions,
                        url: url,
                        key: key
                    })
                    logger.info(`WEBHOOKS - DECISIONS POST - Webhook created correctly, client id: ${id}`);
                    return res.status(http.statuses.OK).send({ "success": true });
                }
            } catch (error) {
                logger.error(`WEBHOOKS - DECISIONS POST - Mongo error ${error}`)
                return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
            }
        }
    } else {
        logger.warning("WEBHOOKS - DECISIONS POST - No url.")
        return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You have to provide url." });
    }
}

exports.decisionsDelete = async function(res, db) {
    try {
        const id = res.locals.id;
        const webhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: id, type: webhooksConfig.type.decisions });
        if (!webhook) {
            logger.warning("WEBHOOKS - DECISIONS DELETE - webhook for this client not registered yet.");
            return res.status(http.statuses.NOT_FOUND).send({ "success": false, "message": "You don't have registered decisions webhook." });
        } else {
            await db.collection(config.DB.names.webhooks).deleteOne({ client_id: id, type: webhooksConfig.type.decisions });
            logger.info("WEBHOOKS - DECISIONS DELETE - webhook has been deleted.");
            return res.status(http.statuses.OK).send({ "success": true });
        }
    } catch (error) {
        logger.error(`WEBHOOKS - DECISIONS DELETE - Mongo error ${error}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

exports.sendDecisionToLenders = async function(req, res, db) {
    return res.status(400).end();
}