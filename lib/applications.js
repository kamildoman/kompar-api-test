'use strict';

const fetch = require('node-fetch');

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
        logger.warning(`OFFER - mandatory fields: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` }); 
    }

    const is_offer_available = body.is_offer_available;
    if (typeof(is_offer_available) === 'boolean' && is_offer_available) {
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

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`OFFER - mandatory fields: ${noMandatoryFields.join(", ")}. Client id ${lender_id}`);
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

    const newOffer = {
        application_id: body.application_id,
        lender_id: lender_id,
        lender_name: res.locals.name,
        is_offer_available: is_offer_available,
        granted_amount: granted_amount,
        duration: duration,
        guarantors: guarantors,
        interest_rate: interest_rate,
        initial_amount: initial_amount,
        total_cost: total_cost,
        monthly_cost: monthly_cost,
        requirements: requirements,
        date: Date.now(),
        date_text: config.common.dateNowText()
    };
    if (is_final_offer !== null && is_final_offer != undefined) {
        if (is_final_offer) {
            newOffer["status"] = "3. Final";
        } else {
            newOffer["status"] = "1. Preliminary";
        }
    } else {
        newOffer["status"] = "1. Preliminary";
    }
    if (requirements !== null && requirements != undefined) {
        newOffer["requirements"] = requirements;
    } else {
        newOffer["requirements"] = [];
    }
    if (early_repayment != null && early_repayment != undefined) {
        newOffer["early_repayment"] = early_repayment;
    }
    if (other_info != null && other_info != undefined) {
        newOffer["other_info"] = other_info;
    }
    try {
        const checkIfApplicationExists = await db.collection(config.DB.names.applications).findOne({ id: body.application_id });
        if (!checkIfApplicationExists) {
            logger.warning(`OFFER - no application with this id: ${body.application_id}. Client id ${lender_id}`);
            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Application with id: ${body.application_id} doesn't exist.` });  
        } else {
            const decisionWebhook = await db.collection(config.DB.names.webhooks).findOne({ client_id: lender_id, type: webhooksConfig.type.decisions });
            if (decisionWebhook) {
                const offers = checkIfApplicationExists.offers;
                if (offers != null && offers != undefined && offers.length > 0) {
                    for (var i = 0; i < offers.length; i++) {
                        const offer = offers[i];
                        if (offer.lender_id === lender_id) {
                            logger.warning(`OFFER - offer of client: ${lender_id} for application id: ${body.application_id}, has been already added.`);
                            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have already added offer for application: ${body.application_id}` });  
                        }
                    }
                }
                if (is_offer_available) {
                    await db.collection(config.DB.names.applications).updateOne(
                        { id: body.application_id }, {
                            $push: {
                                offers: newOffer
                            }
                        }
                    )
                } else {
                    const withoutOffer = {
                        application_id: body.application_id,
                        lender_id: res.locals.id,
                        lender_name: res.locals.name,
                        is_offer_available: false
                    }
                    await db.collection(config.DB.names.applications).updateOne(
                        { id: body.application_id }, {
                            $push: {
                                offers: withoutOffer
                            }
                        }
                    )
                }
                sendOfferToBubble(newOffer, test, lender_id, res.locals.name);
                logger.info(`OFFER - offer of client: ${lender_id} for application id: ${body.application_id}, has been added correctly.`);
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

async function sendOfferToBubble(newOffer, test, lender_id, lender_name) {
    setTimeout(async function() {
        fetch(config.bubble.offer_url(test), {
                method: "POST",
                body: JSON.stringify({
                    application_id: newOffer.application_id,
                    lender_id: lender_id,
                    lender_name: lender_name,
                    is_offer_available: newOffer.is_offer_available,
                    granted_amount: newOffer.granted_amount,
                    duration: newOffer.duration,
                    guarantors: newOffer.guarantors,
                    interest_rate: newOffer.interest_rate,
                    early_repayment: newOffer.early_repayment,
                    initial_amount: newOffer.initial_amount,
                    status: newOffer.status,
                    total_cost: newOffer.total_cost,
                    monthly_cost: newOffer.monthly_cost,
                    requirements: newOffer.requirements,
                    other_info: newOffer.other_info
                }),
                headers: {
                    "Authorization": "Bearer " + config.bubble.auth(test),
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") {
                    logger.info(`SEND OFFER TO BUBBLE: success. Client id ${lender_id}`);
                }
            }).catch(error => {
                logger.warning(`SEND OFFER TO BUBBLE ERROR: ${error}. Client id ${lender_id}`);
            })
    }, 5000);
};

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