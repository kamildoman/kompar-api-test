'use strict';

const http = require('./http_controller');
const config = require('./config');
const application = config.application;
const logger = require('./logger');

exports.offer = async (req, res, db) => {
    const body = req.body;

    const noMandatoryFields = [];
    if (!config.common.hasOwnProperty(body, "application_id")) {
        noMandatoryFields.push("application_id");
    }
    if (!config.common.hasOwnProperty(body, "granted_amount")) {
        noMandatoryFields.push("granted_amount");
    }
    if (!config.common.hasOwnProperty(body, "total_cost")) {
        noMandatoryFields.push("total_cost");
    }

    if (Array.isArray(noMandatoryFields) && noMandatoryFields.length > 0) {
        logger.warning(`OFFER - mandatory fields: ${noMandatoryFields.join(", ")}.`);
        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.` }); 
    }

    var granted_amount = body.granted_amount;
    var total_cost = body.total_cost;

    if (!config.common.isString(granted_amount)) {
        granted_amount = granted_amount.toString();
    }
    if (!config.common.isString(total_cost)) {
        total_cost = total_cost.toString();
    }

    const newOffer = {
        client_id: res.locals.id,
        application_id: body.application_id,
        granted_amount: granted_amount,
        total_cost: total_cost,
        date: Date.now(),
        date_text: config.common.dateNowText()
    };
    try {
        const checkIfApplicationExists = await db.collection(config.DB.names.applications).findOne({ id: body.application_id });
        if (!checkIfApplicationExists) {
            logger.warning(`OFFER - no application with this id: ${body.application_id}`);
            return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `Application with id: ${body.application_id} doesn't exist.` });  
        } else {
            const offers = checkIfApplicationExists.offers;
            const client_id = res.locals.id;
            if (offers != null && offers != undefined && offers.length > 0) {
                for (var i = 0; i < offers.length; i++) {
                    const offer = offers[i];
                    if (offer.client_id === client_id) {
                        logger.warning(`OFFER - offer of client: ${client_id} for application id: ${body.application_id}, has been already added.`);
                        return res.status(http.statuses.BAD_REQUEST).send({ "success": false, "message": `You have already added offer for application: ${body.application_id}` });  
                    }
                }
            }
            await db.collection(config.DB.names.applications).updateOne(
                { id: body.application_id }, { 
                    $push: {
                        offers: newOffer
                    }
                }
            )
            logger.info(`OFFER - offer of client: ${client_id} for application id: ${body.application_id}, has been added correctly.`);
            return res.status(http.statuses.OK).send({ "success": true });  
        }
    } catch (error) {
        logger.error("OFFER - INTERNAL SERVER ERROR: " + error);
        return res.status(http.statuses.INTERNAL_SERVER_ERROR).end();
    }
}