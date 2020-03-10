// @ts-check

'use strict';

class Config {
    constructor() {
        this.DB = {
            uri: "mongodb+srv://new_user_1:jIJj887hhhaisaW87haaaKu77jAs@cluster0-r3os4.mongodb.net/test?retryWrites=true&w=majority",
            database_name: "automatic_test",
        }
    }
}

const config = new Config();

module.exports = config;