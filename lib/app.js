const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");

const Routes = require('./routes');
const Mongo = require('./mongo');

const app = express();
app.use(express.static())

app.use(bodyParser.json());

app.use(function (_req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
});

app.use(function(req, res, next) {
    if (req.path.includes("html") || req.path.includes("js")) {
        return next();
    }
    console.log(req.secure);
    console.log(req.headers["x-forwarded-proto"]);
    if (!req.secure && req.headers["x-forwarded-proto"] == "http") {
        return res.status(400).send("Please use https protocol.");
    }
    return next();
});

app.use(helmet());
app.use(rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // limit each IP to 30 requests per windowMs
}));

(function() {
    new Mongo(function(test_db, production_db) {
        const routes = new Routes(test_db, production_db);
        app.use(routes.router());
    })
}());

module.exports = app;