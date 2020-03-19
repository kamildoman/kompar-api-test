// @ts-check

'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

class Config {
    constructor() {
        this.DB = {
            uri: "mongodb+srv://new_user_1:jIJj887hhhaisaW87haaaKu77jAs@cluster0-r3os4.mongodb.net/test?retryWrites=true&w=majority",
            database_name: "test_1"
        }
        this.secret = "0159f9600c7452a560ab4c16147941ac37c521b5f65327353f57178d3c12d46350b98367847e434f7daebedbe95806f8bcd771c35d633964fe2ce8727f1e332baf117e8b98dd8c243dd7186c900e4e8b71b3e5338b20b3e78635f3f614b876b28723426528ae11610eb92c3039640da593ac7b75357fd7daffcadb0d3a90fc51";
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