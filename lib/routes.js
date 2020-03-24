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
const random = require('./random');
const logger = require('./logger');

const test = "test";

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
            .get(`/${test}/create-password`, (_req, res) => {
                return res.status(http.statuses.OK).sendFile(path.join(__dirname, "public", "test-password.html"));
            })
            .get(`/${test}/token`, (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.test_db, true);
            })
            .post(`/${test}/password`, (req, res) => {
                logger.request(req);
                return password.perform(req, res, this.test_db, true);
            })
            .use(`/${test}/webhooks/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .post(`/${test}/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsPost(req, res, this.test_db);
            })
            .delete(`/${test}/webhooks/applications`, (req, res) => {
                logger.request(req);
                return webhooks.applicationsDelete(res, this.test_db);
            })
            .post(`/${test}/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsPost(req, res, this.test_db);
            })
            .delete(`/${test}/webhooks/decisions`, (req, res) => {
                logger.request(req);
                return webhooks.decisionsDelete(res, this.test_db);
            })
            .use(`/${test}/offer`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .post(`/${test}/offer`, (req, res) => {
                logger.request(req);
                return applications.offer(req, res, this.test_db, true);
            })
            .use(`/${test}/send/webhooks/*`, (req, res, next) => {
                return bubble.auth(req, res, next, true);
            })
            .post(`/${test}/send/webhooks/application`, (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.test_db, true);
            })
            .post(`/${test}/send/webhooks/decision`, (req, res) => {
                logger.request(req);
                return webhooks.sendDecisionToLenders(req, res, this.test_db, true);
            })
            .use(`/${test}/random/*`, (req, res, next) => {
                return token.auth(req, res, next, this.test_db, true);
            })
            .get(`/${test}/random/application`, (req, res) => {
                logger.request(req);
                return random.application(req, res, this.test_db, true);
            })
            .get(`/${test}/random/decision`, (req, res) => {
                logger.request(req);
                return random.decision(req, res, this.test_db, true);
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