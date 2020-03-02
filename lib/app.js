const express = require('express');
const bodyParser = require('body-parser');

const Routes = require('./routes');
const Mongo = require('./mongo');

const app = express();
app.use(bodyParser.json());

(function() {
    new Mongo(function(test_db, production_db) {
        const routes = new Routes(test_db, production_db);
        app.use(routes.router());
    })
}());

module.exports = app;