'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');

const http = require('./http_controller');
const token = require('./token');
const password = require('./password');
const bubble = require('./bubble');
const webhooks = require('./webhooks');
const applications = require('./applications');
const test = require('./test');
const logger = require('./logger');

const testString = "test";

class Routes {
    constructor(test_db, production_db) {
        this.test_db = test_db;
        this.production_db = production_db;
    }
    router() {
        return router
            // both
            .get("/", (_req, res) => {
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "index.html"));
            })
            // test
            .get(`/${testString}/create-password`, (req, res) => {
                logger.requestNoBody(req, "");
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "test-password.html"));
            })
            .post(`/${testString}/password`, (req, res) => {
                logger.requestNoBody(req, "[Confidental]");
                return password.perform(req, res, this.test_db, true);
            })
            .get(`/${testString}/token`, (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.test_db, true);
            })
            .use(`/${testString}/webhooks/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .post(`/${testString}/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsPost(req, res, this.test_db);
            })
            .delete(`/${testString}/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsDelete(res, this.test_db);
            })
            .post(`/${testString}/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsPost(req, res, this.test_db);
            })
            .delete(`/${testString}/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsDelete(res, this.test_db);
            })
            .use(`/${testString}/offer`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .post(`/${testString}/offer`, (req, res) => {
                logger.request(req);
                return applications.offer(req, res, this.test_db, true);
            })
            .post(`/${testString}/send/webhooks/application`, (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.test_db, true);
            })
            .use(`/${testString}/send/webhooks/decision`, (req, res, next) => {
                return bubble.auth(req, res, next, true);
            })
            .post(`/${testString}/send/webhooks/decision`, (req, res) => {
                logger.request(req);
                return webhooks.sendDecisionToLenders(req, res, this.test_db, true);
            })
            .use(`/${testString}/applications/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .post(`/${testString}/applications/close`, (req, res) => {
                logger.request(req);
                return applications.close(req, res, this.test_db, true);
            })
            .post(`/${testString}/applications/signed`, (req, res) => {
                logger.request(req);
                return applications.signed(req, res, this.test_db, true);
            })
            .use(`/${testString}/random/*`, (req, res, next) => {
                logger.request(req);
                return token.auth(req, res, next, this.test_db, true);
            })
            .get(`/${testString}/random/application`, (req, res) => {
                return test.application(res, this.test_db);
            })
            .get(`/${testString}/random/decision`, (req, res) => {
                logger.request(req);
                return test.decision(res, this.test_db);
            })
            .use(`/${testString}/flow/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .get(`/${testString}/flow/start`, (req, res) => {
                logger.request(req);
                return test.flowStart(res, this.test_db);
            })
            .get(`/${testString}/flow/application`, (req, res) => {
                logger.request(req);
                return test.flowApplication(res, this.test_db);
            })
            .get(`/${testString}/flow/decision`, (req, res) => {
                logger.request(req);
                return test.flowDecision(res, this.test_db);
            })
            // production
            .get("/create-password", (_req, res) => {
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "password.html"));
            })
            .post(`/password`, (req, res) => {
                logger.requestNoBody(req, "[Confidental]");
                return password.perform(req, res, this.production_db, false);
            })
            .get(`/token`, (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.production_db, false);
            })
            .use(`/webhooks/*`, (req, res, next) => {
                return token.auth(req, res, next, this.production_db, false);
            })
            .post(`/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsPost(req, res, this.production_db);
            })
            .delete(`/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsDelete(res, this.production_db);
            })
            .post(`/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsPost(req, res, this.production_db);
            })
            .delete(`/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsDelete(res, this.production_db);
            })
            .use(`/offer`, (req, res, next) => {
                return token.auth(req, res, next, this.production_db, false);
            })
            .post(`/offer`, (req, res) => {
                logger.request(req);
                return applications.offer(req, res, this.production_db, false);
            })
            .post(`/send/webhooks/application`, (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.production_db, false);
            })
            .post(`/send/webhooks/decision`, (req, res) => {
                logger.request(req);
                return webhooks.sendDecisionToLenders(req, res, this.production_db, false);
            })
            .use(`/applications/*`, (req, res, next) => {
                return token.auth(req, res, next, this.production_db, false);
            })
            .post(`/applications/close`, (req, res) => {
                logger.request(req);
                return applications.close(req, res, this.production_db, false);
            })
            .post(`/applications/signed`, (req, res) => {
                logger.request(req);
                return applications.signed(req, res, this.production_db, false);
            })
            .post(`/applications/signed`, (req, res) => {
                logger.request(req);
                return applications.signed(req, res, this.production_db, false);
            })
            .post(`/aaa`, (req, res) => {
                logger.request(req);

                const body = req.body;
                const key = "4f4c4334548b44c48a5d5125987dc001";
                const iv = Buffer.from(body.iv, "base64").toString("hex");
                const encryptedData = Buffer.from(body.data, "base64").toString("hex");
                const decipher = crypto.createDecipheriv("AES-256-CBC", key, iv);
                const decrypted = decipher.update(encryptedData, "hex", "utf8") + decipher.final("utf8");
                console.log(decrypted)
                //return applications.signed(req, res, this.production_db, false);
            })
    }
}
const crypto = require("crypto");

module.exports = Routes;