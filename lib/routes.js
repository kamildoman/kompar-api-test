'use strict';

const express = require('express');
const router = express.Router();

const token = require('./token');
const password = require('./password');
const bubble = require('./bubble');
const webhooks = require('./webhooks');
const applications = require('./applications');
const logger = require('./logger');

class Routes {
    constructor(test_db, production_db) {
        this.test_db = test_db;
        this.production_db = production_db;
    }
    router() {
        return router
            .get("/token", (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.test_db);
            })
            // .use("/offer/*", (req, res, next) => {
            //     return token.auth(req, res, next, this.db);
            // })
            .options("/password", (req, res) => {
                logger.request(req);
                return password.performOptions(res);
            })
            .post("/password", (req, res) => {
                logger.request(req);
                return password.perform(req, res, this.test_db);
            })
            .post("/offer", (req, res) => {
                logger.request(req);
                return applications.offer(req, res, this.test_db);
            })
            .use("/send/webhooks/*", (req, res, next) => {
                return bubble.auth(req, res, next);
            })
            .post("/send/webhooks/application", (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.test_db);
            })
            .post("/send/webhooks/decision", (req, res) => {
                return webhooks.sendDecisionToLenders(req, res, this.test_db);
            })
            .use("/webhooks/*", (req, res, next) => {
                return token.auth(req, res, next, this.test_db);
            })
            .post("/webhooks/applications", (req, res) => {
                logger.request(req);
                return webhooks.applicationsPost(req, res, this.test_db);
            })
            .delete("/webhooks/applications", (req, res) => {
                logger.request(req);
                return webhooks.applicationsDelete(res, this.test_db);
            })
            .post("/webhooks/decisions", (req, res) => {
                logger.request(req);
                return webhooks.decisionsPost(req, res, this.test_db);
            })
            .delete("/webhooks/decisions", (req, res) => {
                logger.request(req);
                return webhooks.decisionsDelete(res, this.test_db);
            })
            .use('/html/api', express.static(__dirname + '/html/api', {
                setHeaders: function(res, path) {
                    logger.requestStatic(path);
                    res.set("Access-Control-Allow-Origin", "https://kompar-staging-ef6ba5984f9097e838a1e9cf.webflow.io");
                }
            }))
            .use('/js/api', express.static(__dirname + '/js/api', {
                setHeaders: function(res, path) {
                    logger.requestStatic(path);
                    //res.set("Access-Control-Allow-Origin", "https://kompar-staging-ef6ba5984f9097e838a1e9cf.webflow.io");
                }
            }));
    }
}

module.exports = Routes;