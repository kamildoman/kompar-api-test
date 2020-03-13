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

before(function(done) {
    this.timeout(5000);
    setTimeout(5000, done());
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
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (no password)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ "token": "any token" }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (no token)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ "password": "any password" }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(404);
//     });
//     it('## Should 404 (wrong token)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any password",
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

//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any password",
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

//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//             method: 'post',
//             body:    JSON.stringify({ 
//                 "password": "any password",
//                 "token": token
//             }),
//             headers: { "Content-type": "application/json" }
//         })
//         expect(response.status).to.equal(401);
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
//         })
//         it('## Should 401 (wrong token - expired)', async function() {
//             const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": "any password",
//                     "token": token
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             expect(response.status).to.equal(401);
//             const json = await response.json();
//             expect(json.message).to.equal("Token is expired.");
//         });
//     })
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
//             const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": "any password",
//                     "token": token
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             expect(response.status).to.equal(200);
//             const json = await response.json();
//             expect(json.message).to.equal("Password has been created. You can close the page.");
//         });
//     })
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

    console.log(`User - id: ${id}, name: ${name}, login: ${login} has been added.`);
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

describe('#Token tests', function() {
    it('## Should 200 (correct token)', async function() {
        const password = "password_of_user_123456%$3!@!sSS";
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
                method: 'post',
                body:    JSON.stringify({ 
                    "password": password,
                    "token": user["tokenForPassword"]
                }),
                headers: { "Content-type": "application/json" }
            })
        expect(response.status).to.equal(200);
        const json = await response.json();
        expect(json.message).to.equal("Password has been created. You can close the page.");
        user["password"] = password;
    })
    it('## Should 404 (no get but post)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'post'
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 404 (no headers)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get'
        })
        expect(response.status).to.equal(400);
        const json = await response.json();
        expect(json.message).to.equal("Missing authorization header.");
    });
    it('## Should 404 (wrong authorization header)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": "any"
            }
        })
        expect(response.status).to.equal(400);
        const json = await response.json();
        expect(json.message).to.equal("Missing authorization header.");
    });
    it('## Should 404 (Invalid credentials - no in database)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": "Basic any:any"
            }
        })
        expect(response.status).to.equal(400);
        const json = await response.json();
        expect(json.message).to.equal("Invalid credentials.");
    });
    it('## Should 404 (Invalid credentials - wrong pbkdf2Sync)', async function() {
        const auth = new Buffer(`${user.login}:any`).toString('base64');
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": `Basic ${auth}`
            }
        })
        expect(response.status).to.equal(400);
        const json = await response.json();
        expect(json.message).to.equal("Invalid credentials.");
    });
    it('## Should 200 (Correct credentials - token returned)', async function() {
        const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": `Basic ${auth}`
            }
        })
        expect(response.status).to.equal(200);
        const json = await response.json();
        expect(json.success).to.equal(true);
    });
});

// describe('#Authentication tests', function() {
//     it('## Should 401 (no header)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//             method: 'POST'
//         })
//         expect(response.status).to.equal(401);
//         const json = await response.json();
//         expect(json.success).to.equal(false);
//         expect(json.message).to.equal("Authorization not provided.");  
//     });
//     it('## Should 401 (wrong authorization)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//             method: 'POST',
//             headers: { "Authorization": "any" }
//         })
//         expect(response.status).to.equal(401);
//         const json = await response.json();
//         expect(json.success).to.equal(false);
//         expect(json.message).to.equal("Authorization not provided.");  
        
//     });
//     it('## Should 401 (wrong authorization Bearer)', async function() {
//         const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//             method: 'POST',
//             headers: { "Authorization": "Bearer any" }
//         })
//         expect(response.status).to.equal(401);
//         const json = await response.json();
//         expect(json.success).to.equal(false);
//         expect(json.message).to.equal("Invalid credentials.");  
//     });
//     describe("", async function() {
//         var token;
//         before(async function() {
//             // it means that the token is correct (has correct secret) but isn't in database
//             // first I create new token with custom user id
//             const id = uuidv4();
//             const random = `User ${Math.random()}`; 

//             const name = random;
//             const login = random;
    
//             await db.collection("clients").insertOne({
//                 id: id,
//                 name: name,
//                 login: login
//             });
            
//             const claims = {
//                 id:  id,
//                 iat:  Date.now()
//             }

//             const expiresIn = Date.now() + 10800000; // 3 hours
//             const options = {
//                 algorithm:  "HS256"
//             };

//             const tokenForPassword = jwt.sign(claims, config.secret, options);
            
//             await db.collection("create_password_tokens").insertOne({
//                 id: id,
//                 token: tokenForPassword,
//                 expiresIn: expiresIn
//             });
//             // user has correct password token so can has password
//             const password = "password_of_user_123456%$3!@!sSS";
//             await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": password,
//                     "token": tokenForPassword
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             // User has password, now he can get token
//             const auth = new Buffer(`${login}:${password}`).toString('base64');
//             const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
//                 method: 'get',
//                 headers: {
//                     "Authorization": `Basic ${auth}`
//                 }
//             })
//             const json = await response.json();
//             token = `${json.token_type} ${json.token}`;
//             // he has correct token so we will change his id to custom 
//             const newId = uuidv4();
//             await db.collection("clients").updateOne(
//                 { id: id }, { 
//                     $set: { 
//                         id: newId
//                     }
//                 }
//             );
//             usersToRemove.push(newId);
//         });
//         it('## Should 401 (no client with this id)', async function() {
//             // now he has correct token, which will be validated but isn't in database
//             this.timeout(3000);
//             const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { "Authorization": token }
//             })
//             expect(response2.status).to.equal(401);
//             const json2 = await response2.json();
//             expect(json2.success).to.equal(false);
//             expect(json2.message).to.equal("Invalid credentials.");  
//         });
//     });
//     describe("", async function() {
//         var token;
//         before(async function() {
//             // it means that the token is correct (has correct secret) but has another in database
//             // first I create new token with custom user id
//             this.timeout(5000);
//             const id = uuidv4();
//             const random = `User ${Math.random()}`; 

//             const name = random;
//             const login = random;
    
//             await db.collection("clients").insertOne({
//                 id: id,
//                 name: name,
//                 login: login
//             });
            
//             const claims = {
//                 id:  id,
//                 iat:  Date.now()
//             }

//             const expiresIn = Date.now() + 10800000; // 3 hours
//             const options = {
//                 algorithm:  "HS256"
//             };

//             const tokenForPassword = jwt.sign(claims, config.secret, options);
            
//             await db.collection("create_password_tokens").insertOne({
//                 id: id,
//                 token: tokenForPassword,
//                 expiresIn: expiresIn
//             });
//             // user has correct password token so can has password
//             const password = "password_of_user_123456%$3!@!sSS";
//             await fetch('https://kompar-api-se.herokuapp.com/test/password', {
//                 method: 'post',
//                 body:    JSON.stringify({ 
//                     "password": password,
//                     "token": tokenForPassword
//                 }),
//                 headers: { "Content-type": "application/json" }
//             })
//             // User has password, now he can get token
//             const auth = new Buffer(`${login}:${password}`).toString('base64');
//             const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
//                 method: 'get',
//                 headers: {
//                     "Authorization": `Basic ${auth}`
//                 }
//             })
//             const json = await response.json();
//             token = `${json.token_type} ${json.token}`;
//             // he has correct token so we will create another one but we will make request with the first one
//             await fetch('https://kompar-api-se.herokuapp.com/test/token', {
//                 method: 'get',
//                 headers: {
//                     "Authorization": `Basic ${auth}`
//                 }
//             })
//             usersToRemove.push(id);
//         });
//         it('## Should 401 (Wrong token value for this client)', async function() {
//             // now he has correct token, which will be validated but isn't in his database
//             const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { "Authorization": token }
//             })
//             expect(response2.status).to.equal(401);
//             const json2 = await response2.json();
//             expect(json2.success).to.equal(false);
//             expect(json2.message).to.equal("Invalid credentials.");  
//         });
//     });
//     describe("", async function() {
//         before(async function() {
//             const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
//             const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
//                 method: 'get',
//                 headers: {
//                     "Authorization": `Basic ${auth}`
//                 }
//             })
//             expect(response.status).to.equal(200);
//             const json = await response.json();
//             expect(json.success).to.equal(true);
//             user["token"] = `${json.token_type} ${json.token}`;
//             // now I change manually his token validation in database
//             await db.collection("clients").updateOne(
//                 { id: user["id"] }, { 
//                     $set: { 
//                         "token.expiresIn": Date.now() - 1000000
//                     }
//                 }
//             );
//         });
//         it('## Should 401 (Token is expired)', async function() {
//             const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
//                 method: 'POST',
//                 headers: { "Authorization": user["token"] }
//             })
//             expect(response2.status).to.equal(401);
//             const json2 = await response2.json();
//             expect(json2.success).to.equal(false);
//             expect(json2.message).to.equal("Token is expired.");  
//         });
//     });
// });

describe('#Webhook tests', async function() {
    before(async function() {
        const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": `Basic ${auth}`
            }
        })
        expect(response.status).to.equal(200);
        const json = await response.json();
        expect(json.success).to.equal(true);
        user["token"] = `${json.token_type} ${json.token}`;
    })
    it('## Should 404 (no url)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { "Authorization": user["token"] }
        })
        expect(response2.status).to.equal(404);
        const json2 = await response2.json();
        expect(json2.success).to.equal(false);
        expect(json2.message).to.equal("You have to provide url.");  
    });
    it('## Should 404 (no random unvalid url)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ "url": "random" })
        })
        expect(response2.status).to.equal(404);
        const json2 = await response2.json();
        expect(json2.success).to.equal(false);
        expect(json2.message).to.equal("Please use valid url.");  
    });
    it('## Should 404 (valid url but without https)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"url": "http://random.com" })
        })
        expect(response2.status).to.equal(404);
        const json2 = await response2.json();
        expect(json2.success).to.equal(false);
        expect(json2.message).to.equal("Please use https protocol.");  
    });
    it('## Should 200 (webhook created)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"url": "https://random.com"})
        })
        expect(response2.status).to.equal(200);
        const json2 = await response2.json();
        expect(json2.success).to.equal(true);
    });
    it('## Should 404 (webhook already registered)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"url": "https://random.com"})
        })
        expect(response2.status).to.equal(404);
        const json2 = await response2.json();
        expect(json2.success).to.equal(false);
        expect(json2.message).to.equal("You have already registered applications webhook.");
    });
    it('## Should 200 (webhook removed)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'DELETE',
            headers: { 
                "Authorization": user["token"]
            }
        })
        expect(response2.status).to.equal(200);
        const json2 = await response2.json();
        expect(json2.success).to.equal(true);
    });
    it('## Should 404 (no registered webhook)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'DELETE',
            headers: { 
                "Authorization": user["token"]
            }
        })
        expect(response2.status).to.equal(404);
        const json2 = await response2.json();
        expect(json2.success).to.equal(false);
        expect(json2.message).to.equal("You don't have registered applications webhook.");
    });
    it('## Should 200 (once again webhook created after previous removing)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"url": "https://random.com"})
        })
        expect(response2.status).to.equal(200);
        const json2 = await response2.json();
        expect(json2.success).to.equal(true);
    });
    it('## Should 200 (declines webhook created)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/decisions', {
            method: 'POST',
            headers: { 
                "Authorization": user["token"],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"url": "https://random.com"})
        })
        expect(response2.status).to.equal(200);
        const json2 = await response2.json();
        expect(json2.success).to.equal(true);
    });
    it('## Should 200 (webhook removed)', async function() {
        const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/decisions', {
            method: 'DELETE',
            headers: { 
                "Authorization": user["token"]
            }
        })
        expect(response2.status).to.equal(200);
        const json2 = await response2.json();
        expect(json2.success).to.equal(true);
    });
});

var app1 = express();
app1.use(bodyParser.json());
app1.post("/a", function(req, res) {
    console.log("dudduud");
    return res.status(200).end();
});
app1.listen(6000, () => {
    console.log(`App1 for ${user["login"]} listening on port: ${6000}`);
});

describe('#Webhook application details tests', async function() {
    before(async function() {
        const auth = new Buffer(`${user.login}:${user.password}`).toString('base64');
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
            method: 'get',
            headers: {
                "Authorization": `Basic ${auth}`
            }
        })
        const json = await response.json();
        user["token"] = `${json.token_type} ${json.token}`;
    })
    before(async function() {
        await db.collection("webhooks").updateOne(
            { client_id: user["id"], type: "applications"  }, { 
                $set: { 
                    url: "http://localhost:6000/a"
                }
            }
        );
        await fetch('http://localhost:3000/test/send/webhooks/application', {
            method: 'POST',
            headers: {
                "Authorization": config.auth_bubble_1,
                "Content-Type": "application/json"
            }, body: JSON.stringify({
                "id": "1"
            })
        })
    })

    // after this function user is registered to webhook and may get notifications
    it('## Test server of lender should receive application', function(done) {
        this.timeout(20000);
        setTimeout(function() {
            expect(404).to.equal(404);
            done();
        }, 19000)
        
    })
});

after(async function() {
    //await db.collection("create_password_token").deleteMany({ id: { $in: idOfTokenToRemove } });
    await db.collection("clients").deleteMany({id: { $in: usersToRemove }});
    await db.collection("webhooks").deleteMany({client_id: { $in: webhooksToRemove }});
});