// @ts-check

'use strict';

class Token {
    constructor() {
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
        this.iterations = 51829; //51829
        this.expiresIn = 3600000//120000;//3600000;//3600000; // 1 hour
        this.ALGORITHM = "HS256";
        this.bearer = "Bearer";
    }
    /**
     * @param {boolean} test
    */
    secret(test) {
        if (test) {
            return process.env.TEST_SECRET;
        } else {
            return process.env.SECRET;
        }
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
    /**
     * @param {boolean} test
     */
    timeout(test) {
        if (test) {
            return 2000;
        } else {
            return 10000;
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

    /**
    *  @param {any} variable
    */
    isString(variable) {
        return (typeof(variable) === "string");
    }

    dateNowText() {
        const nowDate = new Date();
        const dd = String(nowDate.getDate()).padStart(2, '0');
        const mm = String(nowDate.getMonth() + 1).padStart(2, '0');
        const yyyy = nowDate.getFullYear();
        return dd + '.' + mm + '.' + yyyy;
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
            uri: process.env.MONGO_URI,
            test_database_name: process.env.TEST_DATABASE_NAME,
            production_database_name: "production",
            names: {
                clients: "clients",
                webhooks: "webhooks",
                applications: "applications",
                create_password_tokens: "create_password_tokens",
                random: {
                    applications: "random_applications",
                    decisions: "random_decisions"
                }
            }
        }
        this.bubble = {
            /**
             * @param {boolean} test
            */
            auth(test) {
                if (test) {
                    return process.env.TEST_BUBBLE_API_TOKEN
                } else {
                    return process.env.BUBBLE_API_TOKEN
                }
            },
            /**
             * @param {boolean} test
            */
            offer_url(test) {
                if (test) {
                    return process.env.TEST_BUBBLE_URL
                } else {
                    return process.env.BUBBLE_URL
                }
            },
            /**
             * @param {boolean} test
            */
            close_url(test) {
                if (test) {
                    return process.env.TEST_BUBBLE_CLOSE_URL
                } else {
                    return process.env.BUBBLE_CLOSE_URL
                }
            },
            /**
             * @param {boolean} test
            */
            signed_url(test) {
                if (test) {
                    return process.env.TEST_BUBBLE_SIGNED_URL
                } else {
                    return process.env.BUBBLE_SIGNED_URL
                }
            },
            /**
             * @param {boolean} test
            */
            sendToLenders(test) {
               if (test) {
                   return [process.env.BUBBLE_SEND_TO_LENDERS_TEST_LOGIN, process.env.BUBBLE_SEND_TO_LENDERS_TEST_PASSWORD];
               } else {
                    return ["", ""];
               }
           }
        }
    }

    /**
     * @param {boolean} test
    */
   pepper(test) {
    if (test) {
        return process.env.TEST_PEPPER;
    } else {
        return process.env.PEPPER;
    }
}
}

const config = new Config(
    new Token(),
    new Password(),
    new Webhook(),
    new Common()
);

module.exports = config;