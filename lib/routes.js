'use strict';

const router = require('express').Router();

const token = require('./token');
const password = require('./password');
const bubble = require('./bubble');
const webhooks = require('./webhooks');
const applications = require('./applications');
const logger = require('./logger');

class Routes {
    constructor(db) {
        this.db = db;
    }
    router() {
        return router
            .get("/token", (req, res) => {
                logger.request(req);
                return token.perform(req, res, this.db);
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
                return password.perform(req, res, this.db);
            })
            .post("/offer", (req, res) => {
                logger.request(req);
                return applications.offer(req, res, this.db);
            })
            .use("/send/webhooks/*", (req, res, next) => {
                return bubble.auth(req, res, next);
            })
            .post("/send/webhooks/application", (req, res) => {
                logger.request(req);
                return webhooks.sendApplicationToLenders(req, res, this.db);
            })
            .post("/send/webhooks/decision", (req, res) => {
                return webhooks.sendDecisionToLenders(req, res, this.db);
            })
            .use("/webhooks/*", (req, res, next) => {
                return token.auth(req, res, next, this.db);
            })
            .post("/webhooks/applications", (req, res) => {
                logger.request(req);
                return webhooks.applicationsPost(req, res, this.db);
            })
            .delete("/webhooks/applications", (req, res) => {
                logger.request(req);
                return webhooks.applicationsDelete(res, this.db);
            })
            .post("/webhooks/decisions", (req, res) => {
                logger.request(req);
                return webhooks.decisionsPost(req, res, this.db);
            })
            .delete("/webhooks/decisions", (req, res) => {
                logger.request(req);
                return webhooks.decisionsDelete(res, this.db);
            })
    }
}

module.exports = Routes;