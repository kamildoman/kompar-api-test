'use strict';

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const http = require('./http_controller');
const config = require('./config');
const webhooksConfig = config.webhook;
const logger = require('./logger');

exports.offer = async (req, res, db, test) => {
    const body = req.body;
    const lender_id = res.locals.id;

    const noMandatoryFields = [];
    if (!config.common.hasOwnProperty(body, "application_id")) {
        noMandatoryFields.push("application_id");
    }
    if (!config.common.hasOwnProperty(body, "is_offer_available")) {
        noMandatoryFields.push("is_offer_available");
    }

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`OFFER - mandatory fields 1: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` }); 
    }

    const is_offer_available = body.is_offer_available;
    console.log(is_offer_available)
    if (typeof(is_offer_available) === 'boolean') {
        if (is_offer_available) {
            if (!config.common.hasOwnProperty(body, "granted_amount")) {
                noMandatoryFields.push("granted_amount");
            }
            if (!config.common.hasOwnProperty(body, "duration")) {
                noMandatoryFields.push("duration");
            }
            if (!config.common.hasOwnProperty(body, "guarantors")) {
                noMandatoryFields.push("guarantors");
            }
            if (!config.common.hasOwnProperty(body, "interest_rate")) {
                noMandatoryFields.push("interest_rate");
            }
            if (!config.common.hasOwnProperty(body, "initial_amount")) {
                noMandatoryFields.push("initial_amount");
            }
            if (!config.common.hasOwnProperty(body, "total_cost")) {
                noMandatoryFields.push("total_cost");
            }
            if (!config.common.hasOwnProperty(body, "monthly_cost")) {
                noMandatoryFields.push("monthly_cost");
            }
        }
    } else {
        logger.warning(`OFFER - is_offer_available must be boolean. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `is_offer_available must be of type boolen` }); 
    }

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`OFFER - mandatory fields 2: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` }); 
    }

    const aboutTypes = [];

    const application_id = body.application_id;
    if (typeof(application_id) !== "string") {
        aboutTypes.push("application_id - has to be a string");
    }

    const granted_amount = body.granted_amount;
    const duration = body.duration;
    const guarantors = body.guarantors;
    const interest_rate = body.interest_rate;
    const early_repayment = body.early_repayment;
    const initial_amount = body.initial_amount;
    const is_final_offer = body.is_final_offer;
    const total_cost = body.total_cost;
    const monthly_cost = body.monthly_cost;
    const requirements = body.requirements;
    const other_info = body.other_info;
    if (is_offer_available) {
        if (granted_amount !== null && granted_amount != undefined && typeof(granted_amount) !== "number") {
            aboutTypes.push("granted_amount - has to be a number");
        }
        if (duration !== null && duration != undefined && typeof(duration) !== "number") {
            aboutTypes.push("duration - has to be a number");
        }
        if (guarantors !== null && guarantors != undefined && typeof(guarantors) !== "number") {
            aboutTypes.push("guarantors - has to be a number");
        }
        if (interest_rate !== null && interest_rate != undefined && typeof(interest_rate) !== "number") {
            aboutTypes.push("interest_rate - has to be a number");
        }
        if (initial_amount !== null && initial_amount != undefined && typeof(initial_amount) !== "number") {
            aboutTypes.push("initial_amount - has to be a number");
        }
        if (total_cost !== null && total_cost != undefined && typeof(total_cost) !== "number") {
            aboutTypes.push("total_cost - has to be a number");
        }
        if (monthly_cost !== null && monthly_cost != undefined && typeof(monthly_cost) !== "number") {
            aboutTypes.push("monthly_cost - has to be a number");
        }
        if (is_final_offer !== null && is_final_offer != undefined && typeof(is_final_offer) !== "boolean") {
            aboutTypes.push("is_final_offer - has to be a boolean");
        }
        if (early_repayment !== null && early_repayment != undefined && typeof(early_repayment) !== "boolean") {
            aboutTypes.push("early_repayment - has to be a boolean");
        }
        if (other_info !== null && other_info != undefined && typeof(other_info) !== "string") {
            aboutTypes.push("other_info - has to be a string");
        }
        if (requirements !== null && requirements != undefined && !Array.isArray(requirements)) {
            aboutTypes.push("requirements - has to be a array");
        } else {
            if (requirements !== null && requirements != undefined && Array.isArray(requirements)) {
                var allString = true;
                requirements.forEach(function(item) {
                    if (typeof(item) !== "string") {
                        allString = false;
                    }
                })
                if (!allString) {
                    aboutTypes.push("requirements - all values inside array have to be string");
                } else {
                    var allGood = true;
                    requirements.forEach(function(item) {
                        if (item !== "Prel. RR & BR" && item !== "Kontohistorik") {
                            allGood = false;
                        }
                    })
                    if (!allGood) {
                        aboutTypes.push("requirements - use values from available options: Prel. RR & BR, Kontohistorik");
                    }
                }
            }
        }
    }
    
    if (Array.isArray(aboutTypes) && aboutTypes.length > 0) {
        logger.warning(`OFFER - about types: ${aboutTypes.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Types error: ${aboutTypes.join(", ")}.` }); 
    }

    try {
        const application2 = await db.collection(config.DB.names.client)
                .aggregate([
                    { "$match": { "applications.id": application_id }},
                    { "$project": {
                        "application": { "$filter": {
                            "input": "$applications",
                            "cond": { "$eq": ["$$this.id", application_id ] }
                        }},
                        "companies": "$companies"
                    }},
                    { "$unwind": "$application" },
                    { "$project": {
                        "_id": 0,
                        "offers": "$application.offers"

                    }}
                ]).toArray();
        const checkIfApplicationExists = application2[0];
        if (checkIfApplicationExists == null) {
            logger.warning(`OFFER - no application with this id: ${body.application_id}. Api client id ${lender_id}`);
            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Application with id: ${body.application_id} doesn't exist.` });  
        } else {
            const decisionWebhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: lender_id, type: webhooksConfig.type.decisions });
            if (decisionWebhook) {
                const offers = checkIfApplicationExists.offers;
                if (offers != null && offers != undefined && offers.length > 0) {
                    for (var i = 0; i < offers.length; i++) {
                        const offer1 = offers[i];
                        if (offer1.api_client_id != null && offer1.api_client_id === lender_id) {
                            logger.warning(`OFFER - offer of api lender: ${lender_id} for application id: ${body.application_id}, has been already added.`);
                            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have already added offer for application: ${body.application_id}` });  
                        }
                    }
                }
                console.log("kupa")
                console.log(is_offer_available);
                if (is_offer_available) {
                    const offer = {};
                    const offer_id = uuidv4();
                    // TODO new type
                    const type = "annuity";
                    const amount = granted_amount.toString();
                    const monthly = parseFloat(monthly_cost).toFixed(2);
                    const total = (total_cost).toString();
                    const interest = parseFloat(interest_rate).toFixed(2);
                    const rating = 5;

                    offer["application_id"] = body.application_id;
                    offer["id"] = offer_id;
                    offer["api_client_id"] = lender_id;
                    offer["lender_id"] = res.locals.partner_id;
                    offer["lender_name"] = res.locals.name;
                    offer["type"] = type;
                    offer["amount"] = amount.toString();
                    offer["duration"] = duration.toString();
                    offer["total"] = total;
                    offer["monthly"] = monthly.toString();
                    offer["interest"] = interest;
                    offer["rating"] = rating;
                    // TODO new phone
                    offer["lender_phone"] = "";
                    offer["fees"] = {
                        "setup": parseFloat(initial_amount).toFixed(2),
                        "administration": "-",
                        "debit": "-"
                    };
                    const complete = [];
                    if (guarantors === 0) {
                        complete.push({ "id": 1, "text": "Ingen personlig borgen krävs", "value": "0" });
                        
                    }
                    else if (guarantors === 1) {
                        complete.push({ "id": 3, "text": "En person behöver borga för lånet", "value": "1" });
                    }
                    else if (guarantors === 2) {
                        complete.push({ "id": 4, "text": "Två personer behöver borga för lånet", "value": "2" });
                    }
                    if (requirements !== null && requirements != undefined) {
                        for (const requ of requirements) {
                            if (requ === "Prel. RR & BR") {
                                complete.push({ "id": 11, "text": "Resultaträkning & balansräkning" });
                            }
                            if (requ === "Kontohistorik") {
                                complete.push({ "id": 12, "text": "Kontohistorik" });
                            }
                        }
                    }
                    offer["complete"] = complete;
                    if (is_final_offer !== null && is_final_offer != undefined) {
                        if (is_final_offer) {
                            offer["status"] = "Final";
                        } else {
                            offer["status"] = "Preliminary";
                        }
                    } else {
                        offer["status"] = "Preliminary";
                    }
                    if (early_repayment != null && early_repayment != undefined) {
                        if (early_repayment) {
                            offer["early"] = "Yes";
                        } else {
                            offer["early"] = "No";
                        }
                    } else {
                        offer["early"] = "No";
                    }
                    offer["date"] = config.time.toCorrectZone(Date.now());
                    offer["dateText"] = config.common2.dateNowText();
                    offer["other"] = other_info;
                    offer["early_text"] = "";
                
                    fetch(config.kompar_app.offer_url(test), {
                        method: "POST",
                        body: JSON.stringify({
                            application_id: offer.application_id,
                            is_offer_available: is_offer_available,
                            offer: offer
                        }),
                        headers: {
                            "Authorization": "Bearer " + config.kompar_app.auth(test),
                            "Content-Type": "application/json"
                        }
                    })
                    .then(res => {
                        if (res.status === 200) {
                            logger.info(`SEND OFFER TO KOMPAR APP: success. Client id ${lender_id}`);
                        }
                    }).catch(error => {
                        logger.warning(`SEND OFFER TO KOMPAR APP ERROR: ${error}. Client id ${lender_id}`);
                    })
                    logger.info(`OFFER - offer of client: ${lender_id} for application id: ${body.application_id}, has been added correctly.`);
                } else {
                    const offer = {};
                    offer["application_id"] = body.application_id;
                    offer["lender_name"] = res.locals.name;
                    fetch(config.kompar_app.offer_url(test), {
                        method: "POST",
                        body: JSON.stringify({
                            application_id: offer.application_id,
                            is_offer_available: is_offer_available,
                            offer: offer
                        }),
                        headers: {
                            "Authorization": "Bearer " + config.kompar_app.auth(test),
                            "Content-Type": "application/json"
                        }
                    })
                    .then(res => {
                        if (res.status === 200) {
                            logger.info(`SEND OFFER TO KOMPAR APP: success. Client id ${lender_id}`);
                        }
                    }).catch(error => {
                        logger.warning(`SEND OFFER TO KOMPAR APP ERROR: ${error}. Client id ${lender_id}`);
                    })
                    logger.info(`OFFER - offer of client: ${lender_id} for application id: ${body.application_id}, has been added correctly.`);
                }
                
                return res.status(http.statuses.OK).send({ "success": true }); 
            } else {
                logger.warning(`OFFER - no decision webhook. Client id: ${lender_id}.`);
                return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have to register decision webhook first.` });  
            } 
        }
    } catch (error) {
        logger.error(`OFFER - INTERNAL SERVER ERROR: ${error}. Client id ${lender_id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

exports.close = async (req, res, db, test) => {
    const body = req.body;
    const lender_id = res.locals.id;

    const noMandatoryFields = [];
    if (!config.common.hasOwnProperty(body, "application_id")) {
        noMandatoryFields.push("application_id");
    }

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`CLOSE - mandatory fields: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` }); 
    }

    const aboutTypes = [];

    const application_id = body.application_id;
    var reason = body.reason;
    if (typeof(application_id) !== "string") {
        aboutTypes.push("application_id - has to be a string");
    }
    if (reason !== null && reason != undefined && typeof(reason) !== "string") {
        aboutTypes.push("reason - has to be a string");
    }

    if (Array.isArray(aboutTypes) && aboutTypes.length > 0) {
        logger.warning(`CLOSE - about types: ${aboutTypes.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Types error: ${aboutTypes.join(", ")}.` }); 
    }

    if (reason == null || reason === undefined) {
        reason = "";
    }

    try {
        const checkIfApplicationExists = await db.collection(config.DB.names.applications).findOne({ id: application_id });
        if (!checkIfApplicationExists) {
            logger.warning(`CLOSE - no application with this id: ${application_id}. Client id ${lender_id}`);
            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Application with id: ${application_id} doesn't exist.` });  
        } else {
            const offers = checkIfApplicationExists.offers;
            if (offers != null && offers != undefined && offers.length > 0) {
                var hasBeenFound = false;
                var hasBeenClosed = false;
                var hasBeenSigned = false;
                for (var i = 0; i < offers.length; i++) {
                    const offer = offers[i];
                    if (offer.lender_id === lender_id) {
                        hasBeenFound = true;
                        if (offer.closed) {
                            hasBeenClosed = true;
                        }
                        if (offer.signed) {
                            hasBeenSigned = true;
                        }
                    }
                }
                if (hasBeenFound) {
                    if (hasBeenClosed) {
                        logger.warning(`CLOSE - client: ${lender_id} already closed application id: ${body.application_id}.`);
                        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have already closed application ${body.application_id}.` });  
                    } else if (hasBeenSigned) {
                        logger.warning(`CLOSE - client: ${lender_id} already signed application id: ${body.application_id}.`);
                        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have signed application ${body.application_id}. You can't close it.` });
                    } else {
                        await db.collection(config.DB.names.applications).updateOne(
                            { 
                                id: application_id,
                                "offers.lender_id": lender_id
                            }, {
                            $set: {
                                sentDecisionViaWebhook: false,
                                chosenLender: "",
                                "offers.$.closed": true,
                                "offers.$.closed_reason": reason,
                                "offers.$.closed_date": config.common.dateNowText()
                            }
                        });
                        sendCloseToBubble(test, application_id, lender_id, reason);
                        logger.info(`CLOSE - client: ${lender_id} has closed correctly application id: ${body.application_id}`);
                        return res.status(http.statuses.OK).send({ "success": true }); 
                    }
                } else {
                    logger.warning(`CLOSE - client: ${lender_id} did not add offer for application id: ${body.application_id}.`);
                    return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You didn't add offer to this application ${body.application_id}. You can't close it.` });
                }
            } else {
                logger.warning(`CLOSE - client: ${lender_id} no any offers for application id: ${body.application_id}.`);
                return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You didn't add offer to this application ${body.application_id}. You can't close it.` });  
            }
        }
    } catch (error) {
        logger.error(`CLOSE - INTERNAL SERVER ERROR: ${error}. Client id ${lender_id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
};

async function sendCloseToBubble(test, application_id, lender_id, reason) {
    setTimeout(async function() {
        fetch(config.bubble.close_url(test), {
                method: "POST",
                body: JSON.stringify({
                    application_id: application_id,
                    lender_id: lender_id,
                    reason: reason
                }),
                headers: {
                    "Authorization": "Bearer " + config.bubble.auth(test),
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") {
                    logger.info(`SEND CLOSE TO BUBBLE: success. Client id ${lender_id}`);
                }
            }).catch(error => {
                logger.warning(`SEND CLOSE TO BUBBLE ERROR: ${error}. Client id ${lender_id}`);
            })
    }, 5000);
};

exports.signed = async (req, res, db, test) => {
    const body = req.body;
    const lender_id = res.locals.id;

    const noMandatoryFields = [];
    if (!config.common.hasOwnProperty(body, "application_id")) {
        noMandatoryFields.push("application_id");
    }

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`SIGNED - mandatory fields: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` });
    }

    const aboutTypes = [];

    const application_id = body.application_id;
    if (typeof(application_id) !== "string") {
        aboutTypes.push("application_id - has to be a string");
    }

    if (Array.isArray(aboutTypes) && aboutTypes.length > 0) {
        logger.warning(`SIGNED - about types: ${aboutTypes.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Types error: ${aboutTypes.join(", ")}.` });
    }

    try {
        const checkIfApplicationExists = await db.collection(config.DB.names.applications).findOne({ id: application_id });
        if (!checkIfApplicationExists) {
            logger.warning(`SIGNED - no application with this id: ${application_id}. Client id ${lender_id}`);
            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Application with id: ${application_id} doesn't exist.` });
        } else {
            const offers = checkIfApplicationExists.offers;
            if (offers != null && offers != undefined && offers.length > 0) {
                var hasBeenFound = false;
                var hasBeenClosed = false;
                var hasBeenSigned = false;
                for (var i = 0; i < offers.length; i++) {
                    const offer = offers[i];
                    if (offer.lender_id === lender_id) {
                        hasBeenFound = true;
                        if (offer.closed) {
                            hasBeenClosed = true;
                        }
                        if (offer.signed) {
                            hasBeenSigned = true;
                        }
                    }
                }
                var chosenId = "";
                const chosenLender = checkIfApplicationExists.chosenLender;
                if (chosenLender != null && chosenLender != undefined) {
                    chosenId = chosenLender;
                }
                if (hasBeenFound) {
                    if (hasBeenClosed) {
                        logger.warning(`SIGNED - client: ${lender_id} closed application id: ${body.application_id}.`);
                        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have closed application ${body.application_id}. You can't signed it.` });
                    } 
                    // else if (hasBeenSigned) {
                    //     logger.warning(`SIGNED - client: ${lender_id} already signed application id: ${body.application_id}.`);
                    //     return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have already signed application ${body.application_id}.` });
                    // } 
                    else if (chosenId == "") {
                        logger.warning(`SIGNED - client: ${lender_id} no decision for application id: ${body.application_id}.`);
                        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `There is no client's decision for application ${body.application_id}. You can't signed it.` });
                    } 
                    // else if (chosenId !== lender_id) {
                    //     logger.warning(`SIGNED - client: ${lender_id} client didn't choose this lender for application id: ${body.application_id}.`);
                    //     return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Client didn't choose you for application ${body.application_id}. You can't signed it.` });
                    // } 
                    else {
                        await db.collection(config.DB.names.applications).updateOne(
                            {
                                id: application_id,
                                "offers.lender_id": lender_id
                            }, {
                            $set: {
                                "offers.$.signed": true,
                                "offers.$.signed_date": config.common.dateNowText()
                            }
                        });
                        sendSignedToBubble(test, application_id, lender_id);
                        logger.info(`SIGNED - client: ${lender_id} has signed correctly application id: ${body.application_id}`);
                        return res.status(http.statuses.OK).send({ "success": true });
                    }
                } else {
                    logger.warning(`SIGNED - client: ${lender_id} did not add offer for application id: ${body.application_id}.`);
                    return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You didn't add offer to this application ${body.application_id}. You can't signed it.` });
                }
            } else {
                logger.warning(`SIGNED - client: ${lender_id} no any offers for application id: ${body.application_id}.`);
                return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `There is no offers for this application ${body.application_id}. You can't signed it.` });
            }
        }
    } catch (error) {
        logger.error(`SIGNED - INTERNAL SERVER ERROR: ${error}. Client id ${lender_id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
};

async function sendSignedToBubble(test, application_id, lender_id) {
    setTimeout(async function() {
        fetch(config.bubble.signed_url(test), {
                method: "POST",
                body: JSON.stringify({
                    application_id: application_id,
                    lender_id: lender_id
                }),
                headers: {
                    "Authorization": "Bearer " + config.bubble.auth(test),
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") {
                    logger.info(`SEND SIGNED TO BUBBLE: success. Client id ${lender_id}`);
                }
            }).catch(error => {
                logger.warning(`SEND SIGNED TO BUBBLE ERROR: ${error}. Client id ${lender_id}`);
            })
    }, 5000);
};