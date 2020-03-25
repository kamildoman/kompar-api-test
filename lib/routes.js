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
            .get("/", (_req, res) => {
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "index.html"));
            })
            // test
            .get(`/${testString}/create-password`, (_req, res) => {
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "test-password.html"));
            })
            .get(`/${testString}/token`, (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.test_db, true);
            })
            .post(`/${testString}/password`, (req, res) => {
                logger.request(req);
                return password.perform(req, res, this.test_db, true);
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
            .use(`/${testString}/send/webhooks/*`, (req, res, next) => {
                return bubble.auth(req, res, next, true);
            })
            .post(`/${testString}/send/webhooks/application`, (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.test_db, true);
            })
            .post(`/${testString}/send/webhooks/decision`, (req, res) => {
                logger.request(req);
                return webhooks.sendDecisionToLenders(req, res, this.test_db, true);
            })
            .use(`/${testString}/random/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .get(`/${testString}/random/application`, (req, res) => {
                logger.request(req);
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
            // else
            // .use('/html/api', express.static(__dirname + '/html/api', {
            //     setHeaders: function(res, path) {
            //         logger.requestStatic(path);
            //         return res.set("Access-Control-Allow-Origin", "https://kompar-staging-ef6ba5984f9097e838a1e9cf.webflow.io");
            //     }
            // }))
            // .use('/js/api', express.static(__dirname + '/js/api', {
            //     setHeaders: function(res, path) {
            //         logger.requestStatic(path);
            //         return res.set("Access-Control-Allow-Origin", "https://kompar-staging-ef6ba5984f9097e838a1e9cf.webflow.io");
            //     }
            // }));
    }
}

module.exports = Routes;