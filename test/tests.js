'use strict';

const fetch = require("node-fetch");
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');

const expect = require("chai").expect;

const config = require("./config");

const usersToRemove = [];
const webhooksToRemove = [];

//////
var db;

fetch('https://api-automatic-testing.herokuapp.com/init', {
    method: 'get'
})

console.log("init start")
before(function(done) {
    this.timeout(10000);
    setTimeout(function(){
        console.log("init finished")
        done();
    },9500);
});

before(function(done) {
    console.log("\n\n");
    config.before(function(_db) {
        db = _db;
        done();
    })
});

// describe('#Create Password', function() {
//     it('## Should 404 (no body)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (no password)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ "token": "any token" }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (no token)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ "password": "any password" }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (password not string)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": 1,
//                 "token": "any_token"
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.message).to.equal("Password has to be string.");
//     });
//     it('## Should 404 (token not string)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any_password",
//                 "token": 1
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.message).to.equal("Token has to be string.");
//     });
//     it('## Should 404 (password not valid)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any_password",
//                 "token": "any_token"
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.message).to.equal("The password must contains at least 1 lower case letter, 1 upper case letter, 1 numeric character and 1 special character");
//     });
//     it('## Should 404 (wrong token)', async function() {
//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any valid_password_1W!",
//                 "token": "any_token"
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (wrong token - invalid signature)', async function() {
//         const id = uuidv4();
        
//         const claims = {
//             id:  id,
//             iat:  Date.now()
//         }

//         const options = {
//             algorithm:  "HS256"
//         };

//         const token = jwt.sign(claims, "any_secret", options);

//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any valid_password_1W!",
//                 "token": token
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 401 (wrong token - no in database)', async function() {
//         const id = uuidv4();
        
//         const claims = {
//             id:  id,
//             iat:  Date.now()
//         }

//         const options = {
//             algorithm:  "HS256"
//         };

//         const token = jwt.sign(claims, config.secret, options);

//         const response = await fetch('https://api.kompar.se/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any valid_password_1W!",
//                 "token": token
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.message).to.equal("You have no permission to change password.");
//     });
//     describe("", async function() {
//         const id = uuidv4();
            
//         const claims = {
//             id:  id,
//             iat:  Date.now()
//         }
    
//         const options = {
//             algorithm:  "HS256"
//         };
    
//         const token = jwt.sign(claims, config.secret, options);

//         before(async function() {
//             await db.collection("create_password_tokens").insertOne({
//                 id: id,
//                 token: token,
//                 expiresIn: Date.now() - 100000
//             });
//         });
//         it('## Should 401 (wrong token - expired)', async function() {
//             const response = await fetch('https://api.kompar.se/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": "any valid_password_1W!",
//                     "token": token
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             expect(response.status).to.equal(200);
//             const json = await response.json();
//             expect(json.message).to.equal("Token is expired.");
//         });
//     });
//     describe("", async function() {
//         const id = uuidv4();
            
//         const claims = {
//             id:  id,
//             iat:  Date.now()
//         }
    
//         const options = {
//             algorithm:  "HS256"
//         };
    
//         const token = jwt.sign(claims, config.secret, options);

//         before(async function() {
//             await db.collection("create_password_tokens").insertOne({
//                 id: id,
//                 token: token,
//                 expiresIn: Date.now() + 60000000
//             });
//         })
//         it('## Should 200 (correct token)', async function() {
//             const response = await fetch('https://api.kompar.se/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": "any valid_password_1W!",
//                     "token": token
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             expect(response.status).to.equal(200);
//             const json = await response.json();
//             expect(json.message).to.equal("Password has been created. You can close the page.");
//         });
//     });
// });

const user = {};

before(async function() {
    const id = uuidv4();
    const random = `User ${Math.random()}`;

    const name = random;
    const login = random;

    const key = crypto.randomBytes(16).toString('hex');
    const auth = crypto.randomBytes(32).toString('hex');

    await db.collection("clients").insertOne({
        id: id,
        name: name,
        login: login,
        key: key,
        auth: auth
    });

    user["id"] = id;
    user["login"] = login;

    usersToRemove.push(id);
    webhooksToRemove.push(id);
    
    const claims = {
        id:  id,
        iat:  Date.now()
    }

    const expiresIn = Date.now() + 10800000; // 3 hours
    const options = {
        algorithm:  "HS256"
    };

    const tokenForPassword = jwt.sign(claims, config.secret, options);
    
    await db.collection("create_password_tokens").insertOne({
        id: id,
        token: tokenForPassword,
        expiresIn: expiresIn
    });

    user["tokenForPassword"] = tokenForPassword;
});

// describe('#Token tests', function() {
//     it('## Should 200 (correct password token)', async function() {
//         const password = "password_of_user_123456%$3!@!sSS";
//         const response = await fetch('https://api.kompar.se/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": password,
//                     "token": user["tokenForPassword"]
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.message).to.equal("Password has been created. You can close the page.");
//         user["password"] = password;
//     });
//     it('## Should 404 (no get but post)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'post'
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (no headers)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get'
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Missing authorization header.");
//     });
//     it('## Should 404 (no authorization header)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Content-Type": "application/json"
//             }
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Missing authorization header.");
//     });
//     it('## Should 404 (wrong authorization header)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": "any"
//             }
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Missing authorization header.");
//     });
//     it('## Should 404 (no Basic token)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": "Bearer any:any"
//             }
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Missing authorization header.");
//     });
//     it('## Should 404 (Invalid credentials - no in database)', async function() {
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": "Basic any:any"
//             }
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Invalid credentials.");
//     });
//     it('## Should 404 (Invalid credentials - wrong pbkdf2Sync)', async function() {
//         const auth = new Buffer(`${user.login}:any`).toString('base64');
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": `Basic ${auth}`
//             }
//         })
//         expect(response.status).to.equal(400);
//         const json = await response.json();
//         expect(json.message).to.equal("Invalid credentials.");
//     });
//     it('## Should 200 (Correct credentials - token returned)', async function() {
//         const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": `Basic ${auth}`
//             }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.success).to.equal(true);
//     });
// });

// // describe('#Authentication tests', function() {
// //     it('## Should 401 (no header)', async function() {
// //         const response = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //             method: 'POST'
// //         })
// //         expect(response.status).to.equal(401);
// //         const json = await response.json();
// //         expect(json.success).to.equal(false);
// //         expect(json.message).to.equal("Authorization not provided.");  
// //     });
// //     it('## Should 401 (wrong authorization)', async function() {
// //         const response = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //             method: 'POST',
// //             headers: { "Authorization": "any" }
// //         })
// //         expect(response.status).to.equal(401);
// //         const json = await response.json();
// //         expect(json.success).to.equal(false);
// //         expect(json.message).to.equal("Authorization not provided.");  
        
// //     });
// //     it('## Should 401 (wrong authorization Basic but should be Bearer)', async function() {
// //         const response = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //             method: 'POST',
// //             headers: { "Authorization": "Basic any" }
// //         })
// //         expect(response.status).to.equal(401);
// //         const json = await response.json();
// //         expect(json.success).to.equal(false);
// //         expect(json.message).to.equal("Authorization not provided.");  
// //     });
// //     it('## Should 401 (wrong authorization Bearer)', async function() {
// //         const response = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //             method: 'POST',
// //             headers: { "Authorization": "Bearer any" }
// //         })
// //         expect(response.status).to.equal(401);
// //         const json = await response.json();
// //         expect(json.success).to.equal(false);
// //         expect(json.message).to.equal("Invalid credentials.");  
// //     });
// //     describe("", async function() {
// //         var token;
// //         before(async function() {
// //             // it means that the token is correct (has correct secret) but isn't in database
// //             // first I create new token with custom user id
// //             const id = uuidv4();
// //             const random = `User ${Math.random()}`; 

// //             const name = random;
// //             const login = random;
    
// //             await db.collection("clients").insertOne({
// //                 id: id,
// //                 name: name,
// //                 login: login
// //             });
            
// //             const claims = {
// //                 id:  id,
// //                 iat:  Date.now()
// //             }

// //             const expiresIn = Date.now() + 10800000; // 3 hours
// //             const options = {
// //                 algorithm:  "HS256"
// //             };

// //             const tokenForPassword = jwt.sign(claims, config.secret, options);
            
// //             await db.collection("create_password_tokens").insertOne({
// //                 id: id,
// //                 token: tokenForPassword,
// //                 expiresIn: expiresIn
// //             });
// //             // user has correct password token so can has password
// //             const password = "password_of_user_123456%$3!@!sSS";
// //             await fetch('https://api.kompar.se/test/password', {
// //                 method: 'post',
// //                 body:    JSON.stringify({ 
// //                     "password": password,
// //                     "token": tokenForPassword
// //                 }),
// //                 headers: { "Content-type": "application/json" }
// //             })
// //             // User has password, now he can get token
// //             const auth = new Buffer(`${login}:${password}`).toString('base64');
// //             const response = await fetch('https://api.kompar.se/test/token', {
// //                 method: 'get',
// //                 headers: {
// //                     "Authorization": `Basic ${auth}`
// //                 }
// //             })
// //             const json = await response.json();
// //             token = `${json.token_type} ${json.token}`;
// //             // he has correct token so we will change his id to custom 
// //             const newId = uuidv4();
// //             await db.collection("clients").updateOne(
// //                 { id: id }, { 
// //                     $set: { 
// //                         id: newId
// //                     }
// //                 }
// //             );
// //             usersToRemove.push(newId);
// //         });
// //         it('## Should 401 (no client with this id)', async function() {
// //             // now he has correct token, which will be validated but isn't in database
// //             this.timeout(5000);
// //             const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //                 method: 'POST',
// //                 headers: { "Authorization": token }
// //             })
// //             expect(response2.status).to.equal(401);
// //             const json2 = await response2.json();
// //             expect(json2.success).to.equal(false);
// //             expect(json2.message).to.equal("Invalid credentials.");  
// //         });
// //     });
// //     describe("", async function() {
// //         var token;
// //         before(async function() {
// //             // it means that the token is correct (has correct secret) but has another in database
// //             // first I create new token with custom user id
// //             this.timeout(5000);
// //             const id = uuidv4();
// //             const random = `User ${Math.random()}`; 

// //             const name = random;
// //             const login = random;
    
// //             await db.collection("clients").insertOne({
// //                 id: id,
// //                 name: name,
// //                 login: login
// //             });
            
// //             const claims = {
// //                 id:  id,
// //                 iat:  Date.now()
// //             }

// //             const expiresIn = Date.now() + 10800000; // 3 hours
// //             const options = {
// //                 algorithm:  "HS256"
// //             };

// //             const tokenForPassword = jwt.sign(claims, config.secret, options);
            
// //             await db.collection("create_password_tokens").insertOne({
// //                 id: id,
// //                 token: tokenForPassword,
// //                 expiresIn: expiresIn
// //             });
// //             // user has correct password token so can has password
// //             const password = "password_of_user_123456%$3!@!sSS";
// //             await fetch('https://api.kompar.se/test/password', {
// //                 method: 'post',
// //                 body:    JSON.stringify({ 
// //                     "password": password,
// //                     "token": tokenForPassword
// //                 }),
// //                 headers: { "Content-type": "application/json" }
// //             })
// //             // User has password, now he can get token
// //             const auth = new Buffer(`${login}:${password}`).toString('base64');
// //             const response = await fetch('https://api.kompar.se/test/token', {
// //                 method: 'get',
// //                 headers: {
// //                     "Authorization": `Basic ${auth}`
// //                 }
// //             })
// //             const json = await response.json();
// //             token = `${json.token_type} ${json.token}`;
// //             // he has correct token so we will create another one but we will make request with the first one
// //             await fetch('https://api.kompar.se/test/token', {
// //                 method: 'get',
// //                 headers: {
// //                     "Authorization": `Basic ${auth}`
// //                 }
// //             })
// //             usersToRemove.push(id);
// //         });
// //         it('## Should 401 (Wrong token value for this client)', async function() {
// //             // now he has correct token, which will be validated but isn't in his database
// //             const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //                 method: 'POST',
// //                 headers: { "Authorization": token }
// //             })
// //             expect(response2.status).to.equal(401);
// //             const json2 = await response2.json();
// //             expect(json2.success).to.equal(false);
// //             expect(json2.message).to.equal("Invalid credentials.");  
// //         });
// //     });
// //     describe("", async function() {
// //         before(async function() {
// //             const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
// //             const response = await fetch('https://api.kompar.se/test/token', {
// //                 method: 'get',
// //                 headers: {
// //                     "Authorization": `Basic ${auth}`
// //                 }
// //             })
// //             expect(response.status).to.equal(200);
// //             const json = await response.json();
// //             expect(json.success).to.equal(true);
// //             user["token"] = `${json.token_type} ${json.token}`;
// //             // now I change manually his token validation in database
// //             await db.collection("clients").updateOne(
// //                 { id: user["id"] }, { 
// //                     $set: { 
// //                         "token.expiresIn": Date.now() - 1000000
// //                     }
// //                 }
// //             );
// //         });
// //         it('## Should 401 (Token is expired)', async function() {
// //             const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
// //                 method: 'POST',
// //                 headers: { "Authorization": user["token"] }
// //             })
// //             expect(response2.status).to.equal(401);
// //             const json2 = await response2.json();
// //             expect(json2.success).to.equal(false);
// //             expect(json2.message).to.equal("Token is expired.");  
// //         });
// //     });
// // });

// describe('#Webhook tests', async function() {
//     before(async function() {
//         const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
//         const response = await fetch('https://api.kompar.se/test/token', {
//             method: 'get',
//             headers: {
//                 "Authorization": `Basic ${auth}`
//             }
//         })
//         expect(response.status).to.equal(200);
//         const json = await response.json();
//         expect(json.success).to.equal(true);
//         user["token"] = `${json.token_type} ${json.token}`;
//     })
//     it('## Should 404 (no url)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { "Authorization": user["token"] }
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("You have to provide url.");  
//     });
//     it('## Should 404 (url not string)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json" 
//             },
//             body: JSON.stringify({ "url": 1 })
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("Url has to be string.");  
//     });
//     it('## Should 404 (no random unvalid url)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json" 
//             },
//             body: JSON.stringify({ "url": "random" })
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("Please use valid url.");  
//     });
//     it('## Should 404 (valid url but without https)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({"url": "http://random.com" })
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("Please use https protocol.");  
//     });
//     it('## Should 200 (webhook created)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({"url": "https://random.com"})
//         })
//         expect(response2.status).to.equal(200);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(true);
//     });
//     it('## Should 404 (webhook already registered)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({"url": "https://random.com"})
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("You have already registered applications webhook.");
//     });
//     it('## Should 200 (application webhook removed)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'DELETE',
//             headers: { 
//                 "Authorization": user["token"]
//             }
//         })
//         expect(response2.status).to.equal(200);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(true);
//     });
//     it('## Should 404 (no registered webhook)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'DELETE',
//             headers: { 
//                 "Authorization": user["token"]
//             }
//         })
//         expect(response2.status).to.equal(404);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(false);
//         expect(json2.message).to.equal("You don't have registered applications webhook.");
//     });
//     it('## Should 200 (once again webhook created after previous removing)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/applications', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({"url": "https://random.com"})
//         })
//         expect(response2.status).to.equal(200);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(true);
//     });
//     it('## Should 200 (declines webhook created)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/decisions', {
//             method: 'POST',
//             headers: { 
//                 "Authorization": user["token"],
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({"url": "https://random.com"})
//         })
//         expect(response2.status).to.equal(200);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(true);
//     });
//     it('## Should 200 (decisions webhook removed)', async function() {
//         const response2 = await fetch('https://api.kompar.se/test/webhooks/decisions', {
//             method: 'DELETE',
//             headers: { 
//                 "Authorization": user["token"]
//             }
//         })
//         expect(response2.status).to.equal(200);
//         const json2 = await response2.json();
//         expect(json2.success).to.equal(true);
//     });
// });

// describe('#Webhook send application to lenders test', async function() {
//     describe("", async function() {
//         before(async function() {
//             const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
//             const response = await fetch('https://api.kompar.se/test/token', {
//                 method: 'get',
//                 headers: {
//                     "Authorization": `Basic ${auth}`
//                 }
//             })
//             const json = await response.json();
//             user["token"] = `${json.token_type} ${json.token}`;
//         });
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test1/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         it('## First url should return 200 and be confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(true);
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test2/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         before(function(done) {
//             // we need to do timeout, because it will take some time for the second attempt
//             this.timeout(5000);
//             setTimeout(function() {
//                 done();
//             }, 4000);
//         });
//         it('## Second url should return 200 on second attempt and be confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(true);
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test3/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         before(function(done) {
//             // we need to do timeout, because it will take some time for the second attempt
//             this.timeout(7000);
//             setTimeout(function() {
//                 done();
//             }, 6000);
//         });
//         it('## Third url should return 200 on third attempt and be confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(true);
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test4/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         before(function(done) {
//             // we need to do timeout, because it will take some time for the second attempt
//             this.timeout(9000);
//             setTimeout(function() {
//                 done();
//             }, 8000);
//         });
//         it('## Fourth url should return 200 on fourth attempt and be confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(true);
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test5/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         before(function(done) {
//             // we need to do timeout, because it will take some time for the second attempt
//             this.timeout(9000);
//             setTimeout(function() {
//                 done();
//             }, 8000);
//         });
//         it('## Fifth url should return 200 on fifth attempt and be confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(true);
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             await db.collection("applications").updateOne(
//                 { id: "test_1_application_1" }, { 
//                     $set: { 
//                         sentViaWebhook: false
//                     }
//                 }
//             );
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'DELETE',
//                 headers: { 
//                     "Authorization": user["token"]
//                 }
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { 
//                     "Authorization": user["token"],
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test6/application"})
//             })
//         });
//         before(async function() {
//             await fetch('https://api.kompar.se/test/send/webhooks/application', {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": config.auth_bubble_1,
//                     "Content-Type": "application/json"
//                 }, body: JSON.stringify({
//                     "id": "test_1_application_1"
//                 })
//             })
//         });
//         before(function(done) {
//             // we need to do timeout, because it will take some time for the second attempt
//             this.timeout(11000);
//             setTimeout(function() {
//                 done();
//             }, 10000);
//         });
//         it('## Sixth url should never confirmed', async function() {
//             const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
//             expect(application.webhooks[0].confirmed).to.equal(false);
//             expect(application.webhooks[0].after_resend_not_confirmed).to.equal(true);
//         });
//     });
// });

describe('#Webhook send application to lenders test', async function() {
    describe("", async function() {
        before(async function() {
            const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
            const response = await fetch('https://api.kompar.se/test/token', {
                method: 'get',
                headers: {
                    "Authorization": `Basic ${auth}`
                }
            })
            const json = await response.json();
            user["token"] = `${json.token_type} ${json.token}`;
        });
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test1/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        it('## First url should return 200 and be confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(true);
        });
    });
    describe("", async function() {
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test2/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        before(function(done) {
            // we need to do timeout, because it will take some time for the second attempt
            this.timeout(5000);
            setTimeout(function() {
                done();
            }, 4000);
        });
        it('## Second url should return 200 on second attempt and be confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(true);
        });
    });
    describe("", async function() {
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test3/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        before(function(done) {
            // we need to do timeout, because it will take some time for the second attempt
            this.timeout(7000);
            setTimeout(function() {
                done();
            }, 6000);
        });
        it('## Third url should return 200 on third attempt and be confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(true);
        });
    });
    describe("", async function() {
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test4/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        before(function(done) {
            // we need to do timeout, because it will take some time for the second attempt
            this.timeout(9000);
            setTimeout(function() {
                done();
            }, 8000);
        });
        it('## Fourth url should return 200 on fourth attempt and be confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(true);
        });
    });
    describe("", async function() {
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test5/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        before(function(done) {
            // we need to do timeout, because it will take some time for the second attempt
            this.timeout(9000);
            setTimeout(function() {
                done();
            }, 8000);
        });
        it('## Fifth url should return 200 on fifth attempt and be confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(true);
        });
    });
    describe("", async function() {
        before(async function() {
            await db.collection("applications").updateOne(
                { id: "test_1_application_1" }, { 
                    $set: { 
                        sentViaWebhook: false
                    }
                }
            );
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'DELETE',
                headers: { 
                    "Authorization": user["token"]
                }
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/webhooks/applications', {
                method: 'POST',
                headers: { 
                    "Authorization": user["token"],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": "https://api-automatic-testing.herokuapp.com/test6/application"})
            })
        });
        before(async function() {
            await fetch('https://api.kompar.se/test/send/webhooks/application', {
                method: 'POST',
                headers: {
                    "Authorization": config.auth_bubble_1,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "id": "test_1_application_1"
                })
            })
        });
        before(function(done) {
            // we need to do timeout, because it will take some time for the second attempt
            this.timeout(11000);
            setTimeout(function() {
                done();
            }, 10000);
        });
        it('## Sixth url should never confirmed', async function() {
            const application = await db.collection("applications").findOne( { id: "test_1_application_1" });
            expect(application.webhooks[0].confirmed).to.equal(false);
            expect(application.webhooks[0].after_resend_not_confirmed).to.equal(true);
        });
    });
});

after(async function() {
    //await db.collection("create_password_token").deleteMany({ id: { $in: idOfTokenToRemove } });
    await db.collection("clients").deleteMany({id: { $in: usersToRemove }});
    await db.collection("webhooks").deleteMany({client_id: { $in: webhooksToRemove }});
});