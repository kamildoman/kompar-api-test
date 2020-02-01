// @ts-check

'use strict';

class Token {
    constructor() {
        this.secret = "secret";
        this.property = {
            login: "login",
            password: "password"
        }
        this.info = {
            missing_authorization: "Missing authorization header.",
            invalid_credentials: "Invalid credentials."
        }
        this.logs = {
            missing_authorization(headers) {
                return `TOKEN - Missing authorization header: [${headers}].`;
            },
            /**
             * @param {string} login
             *  @param {string} message
             */
            invalid_credentials(login, message) {
                return `TOKEN - Invalid credentials: [login: ${login}, message: ${message}].`;
            }
        }
        this.key_length = 512;
        this.iterations = 65000; //65000
        this.expiresIn = 60000;//360000; // 1 hour
        this.ALGORITHM = "HS256";
        this.bearer = "Bearer";
    }
}

class Common {
    constructor() {
        this.type = {
            string: "string",
            base64: "base64",
            ascii: "ascii",
            basic: "Basic",
            sha512: "SHA512",
            hex: "hex"
        }
    }
    /**
     * @param {string} message
     */
    failure(message) {
        return { "success": false, "message": message };
    }
}

class Config {
    /**
     * @param {Token} token
     * @param {Common} common
     */
    constructor(token, common) {
        this.token = token;
        this.common = common;
        this.PORT = process.env.PORT || 3000;
        this.DB = {
            uri: "mongodb+srv://new_user_1:jIJj887hhhaisaW87haaaKu77jAs@cluster0-r3os4.mongodb.net/test?retryWrites=true&w=majority",
            database_name: "test",
            names: {
                clients: "clients"
            }
        }
        // TODO
        this.PEPPER = "zmxejzkridhlzlgbfwbttijgwdiczsmq";
    }
}

const config = new Config(
    new Token(),
    new Common()
);

module.exports = config;