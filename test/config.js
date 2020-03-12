// @ts-check

'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

class Config {
    constructor() {
        this.DB = {
            uri: "mongodb+srv://new_user_1:jIJj887hhhaisaW87haaaKu77jAs@cluster0-r3os4.mongodb.net/test?retryWrites=true&w=majority",
            database_name: "test"
        }
        this.secret = "054651db5112578a83e327e00408836ec743aabfa248cb7131353709e2b44c6297ef71afb7d91b8bbbfda8a4b9a7aee52dd5dca8ab25bee39282546f9e7c4712fc1fe9279a451e0aee363f993eaab04a243c5e9a6e1bb4bffe15e95e40904d1e7317dbe60432693dce745e5df1595c0e180402059c28636733bb59ee4557457d";
        this.auth_bubble_1 = "Basic S3ViYTpCYW5hc2lhaw==";
    }
    before(onFinish) {
        const uri = config.DB.uri;
        const client = new MongoClient(uri, { 
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    
        const name = config.DB.database_name;
        client.connect(error => {
            if (error) console.log(`Unable to connect to MongoDB: ${uri}. Error: ${error}`);
            else {
                console.log(`Connected to MongoDB. -----> NAME OF DATABASE: ${name} <-----`);
                onFinish(client.db(name));
            }
        });
    }
}

const config = new Config();

module.exports = config;