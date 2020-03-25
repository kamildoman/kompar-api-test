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
        if (!config.common.hasOwnProperty(body, "early_repayment")) {
            noMandatoryFields.push("early_repayment");
        }
        if (!config.common.hasOwnProperty(body, "initial_amount")) {
            noMandatoryFields.push("initial_amount");
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
    if (is_offer_available) {
        if (typeof(granted_amount) !== "number") {
            aboutTypes.push("granted_amount - has to be a number");
        }
        if (typeof(duration) !== "number") {
            aboutTypes.push("duration - has to be a number");
        }
        if (typeof(guarantors) !== "number") {
            aboutTypes.push("guarantors - has to be a number");
        }
        if (typeof(interest_rate) !== "number") {
            aboutTypes.push("interest_rate - has to be a number");
        }
        if (typeof(early_repayment) !== "boolean") {
            aboutTypes.push("early_repayment - has to be a boolean");
        }
        if (typeof(initial_amount) !== "number") {
            aboutTypes.push("initial_amount - has to be a number");
        }
        if (is_final_offer !== null && is_final_offer != undefined && typeof(is_final_offer) !== "boolean") {
            aboutTypes.push("is_final_offer - has to be a boolean");
        }
        if (total_cost !== null && total_cost != undefined && typeof(total_cost) !== "number") {
            aboutTypes.push("total_cost - has to be a number");
        }
        if (monthly_cost !== null && monthly_cost != undefined && typeof(monthly_cost) !== "number") {
            aboutTypes.push("monthly_cost - has to be a number");
        }
    }
    
    if (Array.isArray(aboutTypes) && aboutTypes.length > 0) {
        logger.warning(`OFFER - about types: ${aboutTypes.join(", ")}. Client id ${lender_id}`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Types error: ${aboutTypes.join(", ")}.` }); 
    }

    const newOffer = {
        application_id: body.application_id,
        lender_id: res.locals.id,
        lender_name: res.locals.name,
        is_offer_available: is_offer_available,
        granted_amount: granted_amount,
        duration: duration,
        guarantors: guarantors,
        interest_rate: interest_rate,
        early_repayment: early_repayment,
        initial_amount: initial_amount,
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
    if (total_cost !== null && total_cost != undefined) {
        newOffer["total_cost"] = total_cost;
    } else {
        newOffer["total_cost"] = -1;
    }
    if (monthly_cost !== null && monthly_cost != undefined) {
        newOffer["monthly_cost"] = monthly_cost;
    } else {
        newOffer["monthly_cost"] = -2;
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
                const client_id = res.locals.id;
                if (offers != null && offers != undefined && offers.length > 0) {
                    for (var i = 0; i < offers.length; i++) {
                        const offer = offers[i];
                        if (offer.lender_id === client_id) {
                            logger.warning(`OFFER - offer of client: ${client_id} for application id: ${body.application_id}, has been already added.`);
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
                sendOfferToBubble(res, newOffer, test, client_id);
                logger.info(`OFFER - offer of client: ${client_id} for application id: ${body.application_id}, has been added correctly.`);
                return res.status(http.statuses.OK).send({ "success": true }); 
            } else {
                logger.warning(`OFFER - no decision webhook. Client id: ${client_id}.`);
                return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have to register decision webhook first.` });  
            } 
        }
    } catch (error) {
        logger.error(`OFFER - INTERNAL SERVER ERROR: ${error}. Client id ${lender_id}`);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}

async function sendOfferToBubble(res, newOffer, test, client_id) {
    setTimeout(async function() {
        fetch(config.bubble.url(test), {
                method: "POST",
                body: JSON.stringify({
                    application_id: newOffer.application_id,
                    lender_id: res.locals.id,
                    lender_name: res.locals.name,
                    is_offer_available: newOffer.is_offer_available,
                    granted_amount: newOffer.granted_amount,
                    duration: newOffer.duration,
                    guarantors: newOffer.guarantors,
                    interest_rate: newOffer.interest_rate,
                    early_repayment: newOffer.early_repayment,
                    initial_amount: newOffer.initial_amount,
                    status: newOffer.status,
                    total_cost: newOffer.total_cost,
                    monthly_cost: newOffer.monthly_cost
                }),
                headers: {
                    "Authorization": "Bearer " + config.bubble.auth(test),
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") {
                    logger.info(`SEND OFFER TO BUBBLE: success. Client id ${client_id}`);
                }
            }).catch(error => {
                logger.warning(`SEND OFFER TO BUBBLE ERROR: ${error}. Client id ${client_id}`);
            })
    }, 5000);
}