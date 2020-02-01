'use strict';

const router = require('express').Router();

const token = require('./token');
const webhooks = require('./webhooks');
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
            .get("/applications", (req, res, next) => {
                return token.auth(req, res, next, this.db);
            }, (req, res) => {
                console.log("next is here");
                return res.status(200).end();
                //return token.perform(req, res, this.db);
            })
            .get("/webhooks", (req, res, next) => {
                return token.auth(req, res, next, this.db);
            }, (req, res) => {
                console.log("weebhook is here");
                return res.status(200).end();
                //return token.perform(req, res, this.db);
            })
    }
}

module.exports = Routes;