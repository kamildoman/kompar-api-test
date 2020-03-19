'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const http_controller = require('./http_controller');
const config = require('./config');
const token = config.token;
const logger = require('./logger');

exports.perform = async (req, res, db, test) => {
    const headers = req.headers;
    const authorization = headers.authorization;
    if (!authorization || authorization.indexOf(`${config.common.type.basic} `) === -1) {
        logger.warning(token.logs.missing_authorization(headers));
        return res.status(http_controller.statuses.BAD_REQUEST).send(config.common.failure(token.info.missing_authorization));
    }
    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, config.common.type.base64).toString(config.common.type.ascii);
    const [login, password] = credentials.split(':');

    const client = await db.collection(config.DB.names.clients).findOne({ login: login });
    if (!client) {
        logger.warning(token.logs.invalid_credentials(login, "No in database"));
        return res.status(http_controller.statuses.BAD_REQUEST).send(config.common.failure(token.info.invalid_credentials));
    } else {
        const salt = client.salt;
        const hash = crypto.pbkdf2Sync(password, salt, token.iterations, token.key_length, config.common.type.sha512).toString(config.common.type.hex) + config.PEPPER;
        if (hash === client.password) {
            return sendToken(res, client, db, test);
        }
        logger.warning(token.logs.invalid_credentials(login, "Wrong pbkdf2Sync"));
        return res.status(http_controller.statuses.BAD_REQUEST).send(config.common.failure(token.info.invalid_credentials));
    }
};

async function sendToken(res, client, db, test) {
    const claims = {
        id:  client.id,
        iat:  Date.now()
    }
    const options = {
        algorithm:  token.ALGORITHM
    }
    const signed_token = jwt.sign(claims, token.secret(test), options);
    await db.collection(config.DB.names.clients).updateOne(
        { id: client.id }, { 
            $set: { 
                token: {
                    value: signed_token,
                    expiresIn: Date.now() + token.expiresIn,
                }
            }
        }
    )
    logger.info("Token has been returned.");
    return res.status(http_controller.statuses.OK).send(
        {
            "success": true,
            "token": signed_token,
            "token_type": token.bearer,
            "expires_in": token.expiresIn / 1000
        }
    )
}

exports.auth = async function(req, res, next, db, test) {
    const headers = req.headers;
    const authorization = headers.authorization;
    if (!authorization || authorization.indexOf(`${token.bearer} `) === -1) {
        logger.warning("Unauthorized: [headers: " + JSON.stringify(req.headers) + "]");
        return res.status(http_controller.statuses.UNAUTHORIZED).send({ "success": false, "message": "Authorization not provided."});
    }
    const jwtBearerToken = req.headers.authorization.split(' ')[1];
    try {
        const options = {
            algorithm:  token.ALGORITHM
        }
        const verifiedToken = jwt.verify(jwtBearerToken, token.secret(test), options);
        const id = verifiedToken.id;
        const client = await db.collection(config.DB.names.clients).findOne({ id: id });
        if (!client) {
            logger.warning("No client with this id.");
            return res.status(http_controller.statuses.UNAUTHORIZED).send({ "success": false, "message": "Invalid credentials."});
        }

        if (client.token.value !== jwtBearerToken) {
            logger.warning("Wrong token value for this client.");
            return res.status(http_controller.statuses.UNAUTHORIZED).send({ "success": false, "message": "Invalid credentials."});
        }

        if (client.token.expiresIn < Date.now()) {
            logger.warning("Token is expired.");
            return res.status(http_controller.statuses.UNAUTHORIZED).send({ "success": false, "message": "Token is expired."});
        }
        res.locals.id = id;
        res.locals.name = client.name;
        res.locals.key = client.key;
        res.locals.auth = client.auth;
        return next();
    } catch(error) {
        logger.error("Not verified token: " + error);
        return res.status(http_controller.statuses.UNAUTHORIZED).send({ "success": false, "message": "Invalid credentials."});
    }
}