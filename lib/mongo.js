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

        const db_name = config.DB.database_name;

        client.connect(error => {
            if (error) logger.error(`Unable to connect to MongoDB: ${uri}. Error: ${error}`);
            else {
                logger.info(`Connected to MongoDB. -----> NAME OF DATABASE: ${db_name} <-----`);
                onConnected(client.db(db_name));
            }
        });
    }
}

module.exports = Mongo;