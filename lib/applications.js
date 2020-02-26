'use strict';

const http_controller = require('./http_controller');
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
        return applicationResponseWarning(res, `Please provide mandatory fields: ${noMandatoryFields.join(", ")}.`, body.id); 
    }

    const newApplication = {
        id: body.id,
        name: body.name.trim(),
        emailAddress: body.emailAddress,
        loanAmount: body.loanAmount,
        loanPurpose: body.loanPurpose,
        groupName: body.groupName,
        business_id: body.business_id,
        mobilePhone1: body.mobilePhone1,
        revenue: body.revenue,
        entityType: body.entityType,
        businessAddress: body.businessAddress,
        city: body.city,
        postcode: body.postcode,
        country: application.SWEDEN,
        yrsBusiness: body.yrsBusiness,
        personal_id: body.personal_id,
        desiredTerm: body.desiredTerm
    };
    try {
        const checkIfAlreadyApplicationAdded = await db.collection(application.DB.applications).findOne({ id: newApplication.id });
        if (!checkIfAlreadyApplicationAdded) {
            await db.collection(application.DB.applications).insertOne({
                id: newApplication.id,
                name: newApplication.name,
                emailAddress: newApplication.emailAddress,
                loanAmount: newApplication.loanAmount,
                loanPurpose: newApplication.loanPurpose,
                groupName: newApplication.groupName,
                business_id: newApplication.business_id,
                mobilePhone1: newApplication.mobilePhone1,
                revenue: newApplication.revenue,
                entityType: newApplication.entityType,
                businessAddress: newApplication.businessAddress,
                city: newApplication.city,
                postcode: newApplication.postcode,
                country: newApplication.country,
                yrsBusiness: newApplication.yrsBusiness,
                personal_id: newApplication.personal_id,
                desiredTerm: newApplication.desiredTerm,
                created_date_text: dateNowText(),
                created_date: Date.now()
            })
            return success(res, application.INFO.success, newApplication.id);
        }
    } catch (error) {
        logger.error(application.INFO.error + " - " + error)
        return res.status(http_controller.statuses.OK).send({ "correct": false, "message": application.INFO.error, "application_id": application_id });
    }
    return applicationResponseWarning(res, application.INFO.already_sent, newApplication.id);
}

function success(res, message, application_id) {
    logger.info(message);
    return res.status(http_controller.statuses.OK).send({ "correct": true, "message": message, "application_id": application_id });
}

function applicationResponseWarning(res, message) {
    logger.warning(message);
    return res.status(http_controller.statuses.OK).send({ "correct": false, "message": message })
}

function dateNowText() {
    const nowDate = new Date();
    const dd = String(nowDate.getDate()).padStart(2, '0');
    const mm = String(nowDate.getMonth() + 1).padStart(2, '0');
    const yyyy = nowDate.getFullYear();
    return dd + '.' + mm + '.' + yyyy;
}