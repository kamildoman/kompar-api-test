'use strict';

const fetch = require('node-fetch');
const fileType = require('file-type');
const HttpsProxyAgent = require('https-proxy-agent');
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

function auth(test) {
    if (test) {
        return "54fe2a8ca517356ab16813b14062eb2fa99fa571db089b40578717842d8002bc2f6df99134690a6a2bc9de70b7f73ba1da058e1ca17bec307184bd18adfcd8aaf38d52a1956d28ce9b8b1afe39818e1632c2116723203e057e6ce246c5fd23e162cd1a6959c6ad01b15679328b07a0d02a14650a7ae6cdaebb94e94745385719";
    } else {
        return process.env.SEND_APPLICATION_TO_API_AUTH;
    }
}

exports.sendApplicationToLenders = async function(req, res, db, test) {
    const body = req.body;
    const client_id = body.client_id;
    const application_id = body.application_id;
    const additional_filtered_lenders = body.additional_filtered_lenders;
    const headers = req.headers;
    const authorization = headers.authorization;
    const token = authorization.split(" ")[1];
    if (client_id != null && application_id != null && token != null && token === auth(test)) {
        try {
            const application2 = await db.collection(config.DB.names.client)
                .aggregate([
                    { "$match": { "id": client_id, "applications.id": application_id }},
                    { "$project": {
                        "name": "$name",
                        "partner_id": "$partner_id",
                        "application": { "$filter": {
                            "input": "$applications",
                            "cond": { "$eq": ["$$this.id", application_id ] }
                        }},
                        "companies": "$companies"
                    }},
                    { "$unwind": "$application" },
                    { "$project": {
                        "name": "$name",
                        "partner_id": "$partner_id",
                        "application": "$application",
                        "company": { "$filter": {
                            "input": "$companies",
                            "cond": { "$eq": ["$$this.id", "$application.company_id" ] }
                        }}
                    }},
                    { "$unwind": "$company" },
                    { "$project": {
                        "_id": 0,
                        "id": "$application.id",
                        "name": "$name",
                        "partner_id": "$partner_id",
                        "company_id": "$company.company_id",
                        "company_name": "$company.name",
                        "company_type": "$company.creditsafe.company_type",
                        "company_revenue": "$application.revenue_per_month",
                        "company_age": "$company.creditsafe.years_business",
                        "amount": "$application.amount",
                        "duration": "$application.duration",
                        "purpose": "$application.use_aim",
                        "sentViaWebhook": "$application.sentViaWebhook"
                    }}
                ]).toArray();
            const application = application2[0];
            console.log(application)
            if (application == null) {
                logger.warning("WEBHOOKS - SEND TO LENDERS - there is no exist client or application");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Client or application with this id doesn't exist." });
            } else if (application.sentViaWebhook != null && application.sentViaWebhook != undefined && application.sentViaWebhook) {
                logger.warning("WEBHOOKS - SEND TO LENDERS - already sent.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Application with this id has been already sent via webhook." });
            } else {
                const sents = [];
                const webhooks = await db.collection(config.DB.names.webhooks).find( { type: webhooksConfig.type.applications}).toArray();
                await (async function () {
                    for await (const webhook of webhooks) {
                        console.log("START")
                        console.log(additional_filtered_lenders)
                        const clientsResponse = await db.collection(config.DB.names.clients).findOne({
                            "id": webhook.client_id
                        })
                        console.log(clientsResponse)
                        const is_clients_excluded = additional_filtered_lenders.filter(a => a.name === clientsResponse.name);
                        console.log(is_clients_excluded)
                        console.log("END")
                        if (is_clients_excluded.length === 0) {
                            try {
                                const requestOptions = {
                                    method: "POST",
                                    body: JSON.stringify(encrypt(application, webhook.key)),
                                    headers: {
                                        "Authorization": "token " + webhook.auth,
                                        "Content-Type": "application/json"
                                    },
                                    timeout: webhooksConfig.timeout(test)
                                };
                                if (clientsResponse.proxy != null && clientsResponse.proxy === true) {
                                    requestOptions["agent"] = new HttpsProxyAgent(process.env.FIXIE_URL);
                                }
                                const webhookResponse = await fetch(webhook.url, requestOptions)
                                if (webhookResponse.status === 200) {
                                    console.log("SENT TO API")
                                    sents.push({
                                        "webhook": webhook,
                                        "confirmed": true,
                                        "after_resend_not_confirmed": false
                                    });
                                } else {
                                    console.log("NOT SENT TO API")
                                    sents.push({
                                        "webhook": webhook,
                                        "confirmed": false,
                                        "after_resend_not_confirmed": false,
                                        "proxy": clientsResponse.proxy
                                    });
                                }
                            } catch (error) {
                                logger.warning("WEBHOOKS - SEND TO LENDERS - send to specific url error: " + error.message);
                                sents.push({
                                    "webhook": webhook,
                                    "confirmed": false,
                                    "after_resend_not_confirmed": false,
                                    "proxy": clientsResponse.proxy
                                });
                            }
                        }
                    }
                    try {
                        const arrayApi = [];
                        for await(const sent of sents) {
                            const clientPartner = await db.collection(config.DB.names.clients).findOne({
                                "id": sent.webhook.client_id
                            });
                            if (clientPartner != null) {
                                arrayApi.push(
                                    {
                                        "lender_id": clientPartner.partner_id,
                                        "lender_name": clientPartner.name,
                                        "error": false,
                                        "type": "Application",
                                        "message": "Correctly sent.",
                                        "date": config.time.toCorrectZone(Date.now())
                                    }
                                )
                            }
                        }
                        await db.collection(config.DB.names.client).updateOne(
                            {
                                "id": client_id,
                                "applications.id": application_id
                            },
                            {
                                "$set": {
                                    "applications.$[replyapplication].sentViaWebhook": true,
                                    "applications.$[replyapplication].webhooks": shortSent(sents)
                                },
                                "$push": {
                                    "applications.$[replyapplication].api": {"$each": arrayApi}
                                }
                            },
                            {
                                "arrayFilters": [{'replyapplication.id': application_id}]
                            }
                        );
                        loop(application, sents, db, test, client_id);
                        logger.info(`WEBHOOKS - SEND TO LENDERS - Client's ${client_id} application ${application_id} has been sent to lenders via webhook. Sent to: ${JSON.stringify(sents)}.`);
                        return res.status(http.statuses.OK).send({
                            "success": true,
                            "message": `Client's ${client_id} application ${application_id} has been sent to lenders via webhook.`
                        });
                    } catch (error) {
                        logger.error(`WEBHOOKS - SEND TO LENDERS - PROMISE error: ${error}`);
                        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
                    }
                })()
            }
        } catch (error) {
            logger.error(`WEBHOOKS - SEND TO LENDERS - MONGO error: ${error}`);
            return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
        }
    } else {
        logger.warning("WEBHOOKS - SEND TO LENDERS - no client_id, application_id in body or token unauthorized.");
        return res.status(http.statuses.OK).send({ "success": false, "message": "You have to provide client id, application id and authorization." });
    }
}

function shortSent(sents) {
    const short = [];
    for (let i = 0; i < sents.length; i++) {
        short.push({
            "_id": sents[i].webhook._id,
            "client_id": sents[i].webhook.client_id,
            "url": sents[i].webhook.url,
            "confirmed": sents[i].confirmed,
            "after_resend_not_confirmed": sents[i].after_resend_not_confirmed
        })
    }
    return short;
}

function encrypt(application, key) {
    const body = {
        "application_id": application.id,
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

async function loop(application, sent, db, test, client_id) {
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
            timeout(i, sent, times, application, db, test, client_id);
        }
    }
}

async function timeout(i, sent, times, application, db, test, client_id) {
    if (sent[i]["current"] < times.length) {
        setTimeout(async function() {
            logger.info("Resent webhook: " + JSON.stringify(sent[i].webhook));
            const requestOptions = {
                method: "POST",
                body: JSON.stringify(encrypt(application, sent[i].webhook.key)),
                headers: {
                    "Authorization": "token " + sent[i].webhook.auth,
                    "Content-Type": "application/json"
                },
                timeout: webhooksConfig.timeout(test)
            }
            if (sent[i].proxy != null && sent[i].proxy === true) {
                requestOptions["agent"] = new HttpsProxyAgent(process.env.FIXIE_URL);
            }
            fetch(sent[i].webhook.url, requestOptions)
                .then(async res => {
                    if (res.status === 200) {
                        logger.info(`WEBHOOKS - RESEND TO LENDER: ${sent[i].webhook.client_id} - confirmed"`);
                        sent[i].confirmed = true;
                        await db.collection(config.DB.names.client).updateOne(
                            {
                                "id": client_id,
                                "applications.id": application.id,
                                "applications.webhooks._id": sent[i].webhook._id
                            }, 
                            {   
                                "$set": {
                                    "applications.$.webhooks.$[replywebhook].confirmed": true
                                }
                            },
                            { 
                                "arrayFilters": [ { 'replywebhook._id': sent[i].webhook._id } ]
                            }
                        );
                    } else {
                        sent[i].confirmed = false;
                        sent[i]["current"] = sent[i]["current"] + 1;
                        timeout(i, sent, times, application, db, test, client_id);
                    }
                }).catch(error => {
                    logger.warning("WEBHOOKS - RESEND TO LENDERS - send to specific url error: " + error.message);
                    sent[i].confirmed = false;
                    sent[i]["current"] = sent[i]["current"] + 1;
                    timeout(i, sent, times, application, db, test, client_id);
                })
        }, times[sent[i]["current"]]);
    } else {
        logger.warning(`WEBHOOKS - RESEND TO LENDERS - finally not confirmed: application_id: ${application.id}`);
        await db.collection(config.DB.names.client).updateOne(
            {
                "id": client_id,
                "applications.id": application.id,
                "applications.webhooks._id": sent[i].webhook._id
            }, 
            {   
                "$set": {
                    "applications.$.webhooks.$[replywebhook].after_resend_not_confirmed": true
                }
            },
            { 
                "arrayFilters": [ { 'replywebhook._id': sent[i].webhook._id } ]
            }
        );
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
                    const key = res.locals.key;
                    const auth = res.locals.auth;
                    await db.collection(config.DB.names.webhooks).insertOne({
                        client_id: id,
                        type: webhooksConfig.type.decisions,
                        url: url,
                        key: key,
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
    const body = req.body;
    const client_id = body.client_id;
    const application_id = body.application_id;
    const accepted_lender_id = body.accepted_lender_id;
    const headers = req.headers;
    const authorization = headers.authorization;
    const token = authorization.split(" ")[1];
    if (client_id != null && application_id != null && token != null && token === auth(test)) {
        try {
            const application2 = await db.collection(config.DB.names.client)
                .aggregate([
                    { "$match": { "id": client_id, "applications.id": application_id }},
                    { "$project": {
                        "name": "$name",
                        "personal_id": "$personal_id",
                        "phone": "$phone",
                        "email": "$email",
                        "partner_id": "$partner_id",
                        "application": { "$filter": {
                            "input": "$applications",
                            "cond": { "$eq": ["$$this.id", application_id ] }
                        }},
                        "companies": "$companies"
                    }},
                    { "$unwind": "$application" },
                    { "$project": {
                        "name": "$name",
                        "personal_id": "$personal_id",
                        "phone": "$phone",
                        "email": "$email",
                        "partner_id": "$partner_id",
                        "application": "$application",
                        "company": { "$filter": {
                            "input": "$companies",
                            "cond": { "$eq": ["$$this.id", "$application.company_id" ] }
                        }},
                        "offer": { "$filter": {
                            "input": "$application.offers",
                            "cond": { "$eq": ["$$this.status", "Chosen" ] }
                        }},
                    }},
                    { "$unwind": "$company" },
                    { "$project": {
                        "_id": 0,
                        "id": "$application.id",
                        "personal_id": "$personal_id",
                        "name": "$name",
                        "phone": "$phone",
                        "email": "$email",
                        "partner_id": "$partner_id",
                        "company_id": "$company.company_id",
                        "company_name": "$company.name",
                        "company_type": "$company.creditsafe.company_type",
                        "company_revenue": "$application.revenue_per_month",
                        "company_age": "$company.creditsafe.years_business",
                        "amount": "$application.amount",
                        "duration": "$application.duration",
                        "purpose": "$application.use_aim",
                        "sentDecisionViaWebhook": "$application.sentDecisionViaWebhook",
                        "offer": "$offer",
                        "offer_lender_id": "$offer.lender_id",
                        "froda_offer_id": "$offer.froda_lender_id",
                        "details": "$application.details"
                    }}
                ]).toArray();
            const application = application2[0];
            if (application == null) {
                logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - there is no exist client or application");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Client or application with this id doesn't exist." });
            } else if (application.sentDecisionViaWebhook != null && application.sentDecisionViaWebhook != undefined && application.sentDecisionViaWebhook) {
                logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - already sent.");
                return res.status(http.statuses.OK).send({ "success": false, "message": "Application with this id has been already sent via webhook." });
            } else {
                const sents = [];
                const webhooks = await db.collection(config.DB.names.webhooks).find( { type: webhooksConfig.type.decisions}).toArray();
                (async function() {
                    for await (const webhook of webhooks) {
                        const clientsResponse = await db.collection(config.DB.names.clients).findOne({
                            "id": webhook.client_id
                        })
                        if (clientsResponse.partner_id === accepted_lender_id.toString()) {
                            if (application.offer_lender_id.toString() === accepted_lender_id.toString()) {
                                const webhookBody = {
                                    "application_id": application.id,
                                    "accepted": true
                                };
                                // Froda
                                if (accepted_lender_id.toString() === "3") {
                                    webhookBody["phone"] = application.phone;
                                    webhookBody["email"] = application.email;
                                    webhookBody["offer_id"] = application.froda_offer_id;
                                }
                                // OPR
                                if (accepted_lender_id.toString() === "9") {
                                    webhookBody["ssn"] = application.personal_id;
                                    webhookBody["name"] = application.name;
                                    webhookBody["phone"] = application.phone;
                                    webhookBody["email"] = application.email;
                                    if (application.details != null) {
                                        const guarantors = [];
                                        for (const g of application.details.guarantors) {
                                            const ob = {
                                                "ssn": g.personal_id,
                                                "email": g.email
                                            }
                                            if (g.owner != null && g.owner === true) {
                                                ob["phone"] = application.phone;
                                            } else {
                                                ob["phone"] = null;
                                            }
                                            if (g.report != null) {
                                                if (g.report.first_name != null && g.report.last_name != null) {
                                                    ob["name"] = g.report.first_name + " " + g.report.last_name;
                                                } else {
                                                    ob["name"] = null;
                                                }
                                            }
                                            guarantors.push(ob);
                                        }
                                        webhookBody["guarantors"] = guarantors;

                                        const files = [];
                                        const offer = application.offer;
                                        await (async function() {
                                            for await (const c of offer.complete) {
                                                if (c.id === 11) {
                                                    const p_l = application.details.p_l;
                                                    for await (const pdf of p_l) {
                                                        const result = await fetch(pdf);
                                                        const buffer = await result.buffer();
                                                        const type = await fileType.fromBuffer(buffer)
                                                        files.push({
                                                            "type": "Prel. RR & BR",
                                                            "filename": decodeURI(pdf.substring(pdf.lastIndexOf('/') + 1)),
                                                            "data": buffer.toString("base64"),
                                                            "file_ext": type.ext
                                                        })
                                                    }
                                                }
                                                if (c.id === 12) {
                                                    const p_l = application.details.bills.files;
                                                    for await (const pdf of p_l) {
                                                        const result = await fetch(pdf);
                                                        const buffer = await result.buffer();
                                                        const type = await fileType.fromBuffer(buffer)
                                                        files.push({
                                                            "type": "Kontohistorik",
                                                            "filename": decodeURI(pdf.substring(pdf.lastIndexOf('/') + 1)),
                                                            "data": buffer.toString("base64"),
                                                            "file_ext": type.ext
                                                        })
                                                    }
                                                }
                                            }
                                        })
                                        webhookBody["files"] = files;
                                    }
                                }
                                let body = null;
                                if (res.locals.encryptDecision) {
                                    body = encryptDecision(webhookBody, webhook.key);
                                } else {
                                    body = webhookBody;
                                }
                                console.log(webhookBody);
                                try {
                                    const requestOptions = {
                                        method: "POST",
                                        body: JSON.stringify(body),
                                        headers: {
                                            "Authorization": "token " + webhook.auth,
                                            "Content-Type": "application/json"
                                        },
                                        timeout: webhooksConfig.timeout(test)
                                    };
                                    if (clientsResponse.proxy != null && clientsResponse.proxy === true) {
                                        requestOptions["agent"] = new HttpsProxyAgent(process.env.FIXIE_URL);
                                    }
                                    const webhookResponse = await fetch(webhook.url, requestOptions)
                                    if (webhookResponse.status === 200) {
                                        sents.push({ "webhook": webhook, "confirmed": true, "after_resend_not_confirmed": false });
                                    } else {
                                        sents.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false, "proxy": clientsResponse.proxy, "encryptDecision": res.locals.encryptDecision });
                                    }
                                } catch(error) {
                                    logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - send to specific url error: " + error.message);
                                    sents.push({ "webhook": webhook, "confirmed": false, "after_resend_not_confirmed": false, "proxy": clientsResponse.proxy, "encryptDecision": res.locals.encryptDecision });
                                }
                            }
                        }
                    }
                    try {
                        const arrayApi = [];
                        for await(const sent of sents) {
                            const clientPartner = await db.collection(config.DB.names.clients).findOne({
                                "id": sent.webhook.client_id
                            });
                            if (clientPartner != null) {
                                arrayApi.push(
                                    {
                                        "lender_id": parseInt(clientPartner.partner_id),
                                        "lender_name": clientPartner.name,
                                        "error": false,
                                        "type": "Accepted",
                                        "message": "Accept of client correctly sent.",
                                        "date": config.time.toCorrectZone(Date.now())
                                    }
                                )
                            }
                        }
                        await db.collection(config.DB.names.client).updateOne(
                            {
                                "id": client_id,
                                "applications.id": application_id
                            },
                            {
                                "$set": {
                                    "applications.$[replyapplication].sentDecisionViaWebhook": true,
                                    "applications.$[replyapplication].decision_webhooks": shortSent(sents),
                                    "applications.$[replyapplication].accepted_lender_id": accepted_lender_id
                                },
                                "$push": {
                                    "applications.$[replyapplication].api": { "$each": arrayApi }
                                }
                            },
                            {
                                "arrayFilters": [ { 'replyapplication.id': application_id } ]
                            }
                        );
                        loopDecision(application, sents, db, test, client_id, accepted_lender_id);
                        logger.info(`WEBHOOKS - SEND DECISION TO LENDERS - Client's ${client_id} application ${application_id} accepting has been sent to lenders via decision webhook. Sent to: ${JSON.stringify(sents)}.`);
                        return res.status(http.statuses.OK).send({ "success": true, "message": `Client's ${client_id} application ${application_id} accepting has been sent to lenders via decision webhook.` });
                    } catch (error) {
                        logger.error(`WEBHOOKS - SEND TO LENDERS - PROMISE error: ${error}`);
                        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
                    }
                })()
            }
        } catch (error) {
            logger.error(`WEBHOOKS - SEND DECISIONS TO LENDERS - MONGO error: ${error}`);
            return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
        }
    }
    else {
        logger.warning("WEBHOOKS - SEND DECISION TO LENDERS - no client_id, application_id in body or token unauthorized.");
        return res.status(http.statuses.OK).send({ "success": false, "message": "You have to provide client id, application id and authorization." });
    }
}

function encryptDecision(data, key) {
    const jsonPayload = JSON.stringify(data);
    const iv = crypto.randomBytes(16).toString('hex').substr(0,16);
    const encryptor = crypto.createCipheriv('AES-256-CBC', key, iv);
    const encrypted = encryptor.update(jsonPayload, 'utf8', 'base64') + encryptor.final('base64');
    return {
        "data": encrypted,
        "iv": new Buffer.from(iv, "hex").toString('base64')
    }
}

async function loopDecision(application, sents, db, test, client_id, accepted_lender_id) {
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
    for (var i = 0; i < sents.length; i++) {
        sents[i]["current"] = 0;
        if (!sents[i].confirmed) {
            timeoutDecision(i, sents, times, application, db, test, client_id, accepted_lender_id);
        }
    }
}

async function timeoutDecision(i, sent, times, application, db, test, client_id, accepted_lender_id) {
    if (sent[i]["current"] < times.length) {
        setTimeout(async function() {
            logger.info("Resent webhook DECISION: " + JSON.stringify(sent[i].webhook));
            const clientsResponse = await db.collection(config.DB.names.clients).findOne({
                "id": sent[i].webhook.client_id
            })
            if (clientsResponse.partner_id === accepted_lender_id.toString()) {
                if (application.offer_lender_id.toString() === accepted_lender_id.toString()) {
                    const webhookBody = {
                        "application_id": application.id,
                        "accepted": true
                    };
                    // Froda
                    if (accepted_lender_id.toString() === "3") {
                        webhookBody["phone"] = application.phone;
                        webhookBody["email"] = application.email;
                        webhookBody["offer_id"] = application.froda_offer_id;
                    }
                    // OPR
                    if (accepted_lender_id.toString() === "9") {
                        if (application.details != null) {
                            const guarantors = [];
                            for (const g of application.details.guarantors) {
                                const ob = {
                                    "ssn": g.personal_id,
                                    "email": g.email
                                }
                                if (g.phone != null && g.phone !== "") {
                                    ob["phone"] = g.phone;
                                } else {
                                    ob["phone"] = null;
                                }
                                if (g.report != null) {
                                    if (g.report.first_name != null && g.report.last_name != null) {
                                        ob["name"] = g.report.first_name + " " + g.report.last_name;
                                    } else {
                                        ob["name"] = null;
                                    }
                                }
                                guarantors.push(ob);
                            }
                            webhookBody["guarantors"] = guarantors;
                        }
                    }

                    let body = null;
                    if (sent[i].encryptDecision) {
                        body = encryptDecision(webhookBody, sent[i].webhook.key);
                    } else {
                        body = webhookBody;
                    }
                    try {
                        const requestOptions = {
                            method: "POST",
                            body: JSON.stringify(body),
                            headers: {
                                "Authorization": "token " + sent[i].webhook.auth,
                                "Content-Type": "application/json"
                            },
                            timeout: webhooksConfig.timeout(test)
                        }
                        if (sent[i].proxy != null && sent[i].proxy === true) {
                            requestOptions["agent"] = new HttpsProxyAgent(process.env.FIXIE_URL);
                        }
                        const webhookResponse = await fetch(sent[i].webhook.url, requestOptions)
                        if (webhookResponse.status === 200) {
                            logger.info(`WEBHOOKS DECISION - RESEND TO LENDER: ${sent[i].webhook.client_id} - confirmed"`);
                            sent[i].confirmed = true;
                            await db.collection(config.DB.names.client).updateOne(
                                {
                                    "id": client_id,
                                    "applications.id": application.id,
                                    "applications.decision_webhooks._id": sent[i].webhook._id
                                }, 
                                {   
                                    "$set": {
                                        "applications.$.decision_webhooks.$[replywebhook].confirmed": true
                                    }
                                },
                                { 
                                    "arrayFilters": [ { 'replywebhook._id': sent[i].webhook._id } ]
                                }
                            );
                        } else {
                            sent[i].confirmed = false;
                            sent[i]["current"] = sent[i]["current"] + 1;
                            timeoutDecision(i, sent, times, application, db, test, client_id, accepted_lender_id);
                        }
                    } catch(error) {
                        logger.warning("WEBHOOKS DECISION - RESEND TO LENDERS - send to specific url error: " + error.message);
                        sent[i].confirmed = false;
                        sent[i]["current"] = sent[i]["current"] + 1;
                        timeoutDecision(i, sent, times, application, db, test, client_id, accepted_lender_id);
                    }
                }
            }
        }, times[sent[i]["current"]]);
    } else {
        logger.warning(`WEBHOOKS DECISION - RESEND TO LENDERS - finally not confirmed: application_id: ${application.id}`);
        await db.collection(config.DB.names.client).updateOne(
            {
                "id": client_id,
                "applications.id": application.id,
                "applications.webhooks._id": sent[i].webhook._id
            }, 
            {   
                "$set": {
                    "applications.$.webhooks.$[replywebhook].after_resend_not_confirmed": true
                }
            },
            { 
                "arrayFilters": [ { 'replywebhook._id': sent[i].webhook._id } ]
            }
        );
    }
}