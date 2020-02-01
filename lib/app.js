const express = require('express');
const bodyParser = require('body-parser');

const Routes = require('./routes');
const Mongo = require('./mongo');

const app = express();
app.use(bodyParser.json());

(function() {
    new Mongo(function(db) {
        const routes = new Routes(db);
        app.use(routes.router());
    })
}());

module.exports = app;