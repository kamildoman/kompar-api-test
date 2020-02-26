'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const http = require('./http_controller');
const config = require('./config');
const password = config.password;
const tokens = config.token;
const logger = require('./logger');

exports.performOptions = (res) => {
    return res.set({
      'Access-Control-Allow-Origin': "https://kompar-staging-ef6ba5984f9097e838a1e9cf.webflow.io",
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    }).status(http.statuses.OK).end()
};


exports.perform = async (req, res, db) => {
    const body = req.body;
    const token = body.token;
    if (token == null) {
        return res.status(http.statuses.NOT_FOUND).end();
    }

    const secret = password.secret;
    const options = {
        algorithm: tokens.ALGORITHM
    };

    try {
        const verifiedToken = jwt.verify(token, secret, options);
       
        const databaseToken = await db.collection(config.DB.names.create_password_tokens).findOne({ id: verifiedToken.id });
        if (!databaseToken) {
            logger.info("PASSWORD - No token in database.");
            return res.status(http.statuses.OK).send({ "message": "You have no permission to change password." });
        }

        if (checkUser.expiresIn < Date.now()) {
            logger.error("PASSWORD - JWT token expired.");
            await db.collection(config.DB.names.create_password_tokens).deleteOne({ id: verifiedToken.id });
            return res.status(http.statuses.OK).send({ "message": "Token is expired." });
        }

        await db.collection(config.DB.names.create_password_tokens).deleteOne({ id: verifiedToken.id });

        const salt = crypto.randomBytes(password.salt_length).toString(config.common.type.hex);
        const pepper = config.PEPPER;
        const hash = crypto.pbkdf2Sync(password, salt, token.iterations, token.key_length, config.common.type.sha512).toString(config.common.type.hex) + pepper;
        await db.collection(config.DB.names.clients).updateOne(
          { id: verifiedToken.id }, { 
              $set: { 
                password: hash,
                salt: salt
              }
          }
        )
        logger.info("PASSWORD - User is validated. The password has been changed.");
        return res.status(http.statuses.OK).send({ "message": "Password has been created. You can close the page." });
    } catch(err) {
          logger.error("PASSWORD - JWT error.");
          return res.status(http.statuses.NOT_FOUND).end();
    }
};