// @ts-check

'use strict';

const aws = require('aws-sdk');
const logger = require('./logger');
const {main} = require("mocha/lib/cli");

try {
    aws.config.update({
        accessKeyId: process.env.AWS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
} catch (error) {
    logger.error(error);
}

async function sendEmail(params) {
    return await new aws.SES().sendEmail(params).promise();
}

function source(test) {
    return test ? `(TEST) KOMPAR <info@kompar.se>` : `<KOMPAR <info@kompar.se>`;
}

function mainPage(test) {
    return test ? "/test/admin/main" : "/admin/main";
}

function url_sign_up_email_admin(unique_id, test) {
    if (!process.env.NOT_LOCALHOST) {
        return `http://localhost:3000${mainPage(test)}/${unique_id}`;
    }
    return `${process.env.APP_ADDRESS}${mainPage(test)}/${unique_id}`;
}

module.exports = {
    admin: {
        async lender_close(db, application_id, lender_name, reason, test) {
            const admins_emails = [];
            const admins = await db.collection("admin").find({}).toArray();
            admins.forEach((admin) => {
                if (admin.emails.lender_offer_close) {
                    admins_emails.push(admin.email);
                }
            });
            return sendEmail({
                Source: source(test),
                Destination: {
                    ToAddresses: admins_emails
                },
                Message: {
                    Subject: {
                        Charset: "UTF-8",
                        Data: test ? `TEST - ${lender_name} canceled application by API ` : `${lender_name} canceled application by API `
                    },
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data:
                                `<html>
                                <body>
                                    Reason: ${reason}<br>
                                    <a href=${url_sign_up_email_admin(application_id, test)}>Open application</a>
                                </body>
                            </html>`
                        }
                    }
                }
            });
        },
        async lender_sign(db, application_id, lender_name, test) {
            const admins_emails = [];
            const admins = await db.collection("admin").find({}).toArray();
            admins.forEach((admin) => {
                if (admin.emails.contract_sign) {
                    admins_emails.push(admin.email);
                }
            });
            return sendEmail({
                Source: source(test),
                Destination: {
                    ToAddresses: admins_emails
                },
                Message: {
                    Subject: {
                        Charset: "UTF-8",
                        Data: test ? `TEST - New offer signed by ${lender_name} API ` : `New offer signed by ${lender_name} API `
                    },
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data:
                                `<html>
                                <body>
                                    <a href=${url_sign_up_email_admin(application_id, test)}>Open application</a>
                                </body>
                            </html>`
                        }
                    }
                }
            });
        }
    }
}