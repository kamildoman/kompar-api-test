'use strict';

exports.auth = async function(req, res, next) {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        //logger.warning("Unauthorized: [headers: " + JSON.stringify(req.headers) + "]");
        return res.status(401).end();
    }
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    if (username === "Kuba" && password === "Banasiak") {
        return next();
    }
    //logger.warning("Unauthorized: [headers: " + JSON.stringify(req.headers) + "user - " + username + ":" + password + "]");
    return res.status(401).end();
}