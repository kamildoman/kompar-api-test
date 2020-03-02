// @ts-check

'use strict';

class Token {
    constructor() {
        this.secret = process.env.SECRET;
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
        this.iterations = 50000; //50000
        this.expiresIn = 3600000//120000;//3600000;//3600000; // 1 hour
        this.ALGORITHM = "HS256";
        this.bearer = "Bearer";
    }
}

class Password {
    constructor() {
        this.salt_length = 128;
    }
}

class Webhook {
    constructor() {
        this.type = {
            applications: "applications",
            decisions: "decisions"
        }
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
        this.property = {
            url: "url"
        }
    }
    /**
     * @param {string} message
     */
    failure(message) {
        return { "success": false, "message": message };
    }

    /**
     * @param {object} where
     * @param {string} name
     */
    hasOwnProperty(where, name) {
        return where.hasOwnProperty(name);
    }

    /**
     * @param {string} url
     */
    isUrlValid(url) {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return pattern.test(url);
    }

    /**
     * @param {string} url
     */
    isUrlHttps(url) {
        return url.substring(0, 8) === 'https://';
    }
}

class Config {
    /**
     * @param {Token} token
     * @param {Password} password
     * @param {Webhook} webhook
     * @param {Common} common
     */
    constructor(token, password, webhook, common) {
        this.token = token;
        this.password = password;
        this.webhook = webhook;
        this.common = common;
        this.PORT = process.env.PORT || 3000;
        this.DB = {
            uri: "mongodb+srv://new_user_1:jIJj887hhhaisaW87haaaKu77jAs@cluster0-r3os4.mongodb.net/test?retryWrites=true&w=majority",
            database_name: "test",
            names: {
                clients: "clients",
                webhooks: "webhooks",
                applications: "applications",
                create_password_tokens: "create_password_tokens"
            }
        }
        this.PEPPER = process.env.PEPPER;
    }
}

const config = new Config(
    new Token(),
    new Password(),
    new Webhook(),
    new Common()
);

module.exports = config;