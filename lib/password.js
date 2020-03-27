'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const http = require('./http_controller');
const config = require('./config');
const password = config.password;
const tokens = config.token;
const logger = require('./logger');

exports.perform = async (req, res, db, test) => {
    const body = req.body;
    const token = body.token;
    const pass = body.password;
    if (token == null || pass == null) {
        return res.status(http.statuses.NOT_FOUND).end();
    }
    if (typeof(token) !== "string") {
        return res.status(http.statuses.OK).send({ "message": "Token has to be string." }); 
    }
    if (typeof(pass) !== "string") {
        return res.status(http.statuses.OK).send({ "message": "Password has to be string." }); 
    }
    const regex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{12,32}$/;
    const exec = regex.exec(pass);
    if (!exec) {
        return res.status(http.statuses.OK).send({ "message": "The password must contains at least 1 lower case letter, 1 upper case letter, 1 numeric character and 1 special character" }); 
    }

    const secret = tokens.secret(test);
    const options = {
        algorithm: tokens.ALGORITHM
    };

    try {
        const verifiedToken = jwt.verify(token, secret, options);
        const databaseToken = await db.collection(config.DB.names.create_password_tokens).findOne({ id: verifiedToken.id });
        if (!databaseToken) {
            logger.warning("PASSWORD - No token in database.");
            return res.status(http.statuses.OK).send({ "message": "You have no permission to change password." });
        }
        if (databaseToken.expiresIn < Date.now()) {
            logger.warning("PASSWORD - JWT token expired.");
            await db.collection(config.DB.names.create_password_tokens).deleteOne({ id: verifiedToken.id });
            return res.status(http.statuses.OK).send({ "message": "Token is expired." });
        }

        await db.collection(config.DB.names.create_password_tokens).deleteOne({ id: verifiedToken.id });

        const salt = crypto.randomBytes(password.salt_length).toString(config.common.type.hex);
        const pepper = config.pepper(test);
        const hash = crypto.pbkdf2Sync(pass, salt, tokens.iterations, tokens.key_length, config.common.type.sha512).toString(config.common.type.hex) + pepper;
        const client = await db.collection(config.DB.names.clients).findOneAndUpdate(
          { id: verifiedToken.id }, 
          { 
            $set: { 
                password: hash,
                salt: salt
            }
          }
        )
        logger.info("PASSWORD - User is validated. The password has been created.");
        return res.status(http.statuses.OK).send(
            { 
                "login": client.value.login,
                "auth": client.value.auth,
                "key": client.value.key,
                "message": "Password has been created. Remember to save your credentials. You won't be able to see them no more." 
            });
    } catch(err) {
          logger.error("PASSWORD - JWT error: " + err);
          return res.status(http.statuses.NOT_FOUND).end();
    }
};