const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const compression = require('compression');



const Routes = require('./routes');
const Mongo = require('./mongo');
const http = require('./http_controller');

const app = express();

app.use(compression());
app.use(bodyParser.json());

app.use(function (_req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
});

app.use(function(req, res, next) {
    if (!req.secure && req.headers["x-forwarded-proto"] === "http") {
        return res.status(http.statuses.BAD_REQUEST).send("Please use https protocol.");
    }
    return next();
});
app.use(express.static(path.join(__dirname, "public")));
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