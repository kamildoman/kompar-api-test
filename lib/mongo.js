'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const config = require('./config');
const logger = require('./logger');

class Mongo {
    constructor(onConnected) {
        const uri = config.DB.uri;
        const client = new MongoClient(uri, { 
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const test_db_name = config.DB.test_database_name;
        const production_db_name = config.DB.production_database_name;
        client.connect(error => {
            if (error) logger.error(`Unable to connect to MongoDB. Error: ${error}`);
            else {
                logger.info(`Connected to MongoDB. -----> NAME OF TEST DATABASE: ${test_db_name} <----- !! -----> NAME OF PRODUCTION DATABASE: ${production_db_name} <-----`);
                onConnected(client.db(test_db_name), client.db(production_db_name));
            }
        });
    }
}

module.exports = Mongo;