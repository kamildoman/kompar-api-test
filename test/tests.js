'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const fetch = require("node-fetch");
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');

const expect = require("chai").expect;

const config = require("./config");
const usersToRemove = [];

//////
var db;

before(function(done) {
    const uri = config.DB.uri;
    const client = new MongoClient(uri, { 
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const name = config.DB.database_name;
    client.connect(error => {
        if (error) console.log(`Unable to connect to MongoDB: ${uri}. Error: ${error}`);
        else {
            console.log(`Connected to MongoDB. -----> NAME OF DATABASE: ${name} <-----`);
            db = client.db(name);
            done();
        }
    });
});

describe('#Create Password', function() {
    it('## Should 404 (no body)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 404 (no password)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ "token": "any token" }),
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 404 (no token)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ "password": "any password" }),
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 404 (wrong token)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ 
                "password": "any password",
                "token": "any_token"
            }),
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 404 (wrong token - invalid signature)', async function() {
        const id = uuidv4();
        
        const claims = {
            id:  id,
            iat:  Date.now()
        }

        const options = {
            algorithm:  "HS256"
        };

        const token = jwt.sign(claims, "any_secret", options);

        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ 
                "password": "any password",
                "token": token
            }),
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(404);
    });
    it('## Should 401 (wrong token - no in database)', async function() {
        const id = uuidv4();
        
        const claims = {
            id:  id,
            iat:  Date.now()
        }

        const options = {
            algorithm:  "HS256"
        };

        const token = jwt.sign(claims, config.secret, options);

        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ 
                "password": "any password",
                "token": token
            }),
            headers: { "Content-type": "application/json" }
        })
        expect(response.status).to.equal(401);
        const json = await response.json();
        expect(json.message).to.equal("You have no permission to change password.");
    });
    describe("", async function() {
        const id = uuidv4();
            
        const claims = {
            id:  id,
            iat:  Date.now()
        }
    
        const options = {
            algorithm:  "HS256"
        };
    
        const token = jwt.sign(claims, config.secret, options);

        before(async function() {
            await db.collection("create_password_tokens").insertOne({
                id: id,
                token: token,
                expiresIn: Date.now() - 100000
            });
        })
        it('## Should 401 (wrong token - expired)', async function() {
            const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
                method: 'post',
                body:    JSON.stringify({ 
                    "password": "any password",
                    "token": token
                }),
                headers: { "Content-type": "application/json" }
            })
            expect(response.status).to.equal(401);
            const json = await response.json();
            expect(json.message).to.equal("Token is expired.");
        });
    })
    describe("", async function() {
        const id = uuidv4();
            
        const claims = {
            id:  id,
            iat:  Date.now()
        }
    
        const options = {
            algorithm:  "HS256"
        };
    
        const token = jwt.sign(claims, config.secret, options);

        before(async function() {
            await db.collection("create_password_tokens").insertOne({
                id: id,
                token: token,
                expiresIn: Date.now() + 60000000
            });
        })
        it('## Should 200 (correct token)', async function() {
            const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
                method: 'post',
                body:    JSON.stringify({ 
                    "password": "any password",
                    "token": token
                }),
                headers: { "Content-type": "application/json" }
            })
            expect(response.status).to.equal(200);
            const json = await response.json();
            expect(json.message).to.equal("Password has been created. You can close the page.");
        });
    })
});

const user = {};

before(async function() {
    try {
        const id = uuidv4();
        const random = `User ${Math.random()}`;

        const name = random;
        const login = random;

        await db.collection("clients").insertOne({
            id: id,
            name: name,
            login: login
        });

        user["id"] = id;
        user["login"] = login;

        console.log(`User - id: ${id}, name: ${name}, login: ${login} has been added.`);
        usersToRemove.push(id);
        
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

        console.log("Create password token has been added.");

        user["tokenForPassword"] = tokenForPassword;
    } catch(error) {

    }
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

describe('#Authentication tests', function() {
    it('## Should 200 (token returned)', async function() {
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
    });
    it('## Should 401 (no header)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST'
        })
        expect(response.status).to.equal(401);
        const json = await response.json();
        expect(json.success).to.equal(false);
        expect(json.message).to.equal("Authorization not provided.");  
    });
    it('## Should 401 (wrong authorization)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { "Authorization": "any" }
        })
        expect(response.status).to.equal(401);
        const json = await response.json();
        expect(json.success).to.equal(false);
        expect(json.message).to.equal("Authorization not provided.");  
        
    });
    it('## Should 401 (wrong authorization Bearer)', async function() {
        const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
            method: 'POST',
            headers: { "Authorization": "Bearer any" }
        })
        expect(response.status).to.equal(401);
        const json = await response.json();
        expect(json.success).to.equal(false);
        expect(json.message).to.equal("Invalid credentials.");  
    });
    describe("", async function() {
        it('## Should 401 (no client with this id)', async function() {
            // it means that the token is correct (has correct secret) but isn't in database
            // first I create new token with custom user id
            const id = uuidv4();
            const random = `User ${Math.random()}`; 

            const name = random;
            const login = random;
    
            await db.collection("clients").insertOne({
                id: id,
                name: name,
                login: login
            });
            
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
            // user has correct password token so can has password
            const password = "password_of_user_123456%$3!@!sSS";
            await fetch('https://kompar-api-se.herokuapp.com/test/password', {
                method: 'post',
                body:    JSON.stringify({ 
                    "password": password,
                    "token": tokenForPassword
                }),
                headers: { "Content-type": "application/json" }
            })
            // User has password, now he can get token
            const auth = new Buffer(`${login}:${password}`).toString('base64');
            const response = await fetch('https://kompar-api-se.herokuapp.com/test/token', {
                method: 'get',
                headers: {
                    "Authorization": `Basic ${auth}`
                }
            })
            const json = await response.json();
            const token = `${json.token_type} ${json.token}`;
            // he has correct token so we will change his id to custom 
            const newId = uuidv4();
            await db.collection("clients").updateOne(
                { id: id }, { 
                    $set: { 
                        id: newId
                    }
                }
            );
            usersToRemove.push(newId);
            // now he has correct token, which will be validated but isn't in database
            const response2 = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
                method: 'POST',
                headers: { "Authorization": token }
            })
            expect(response2.status).to.equal(401);
            const json2 = await response2.json();
            expect(json2.success).to.equal(false);
            expect(json2.message).to.equal("Invalid credentials.");  
        });
    });
    
    // it('## Should 400 no method (should be post)', async function() {
    //     const response = await fetch('https://kompar-api-se.herokuapp.com/test/webhooks/applications', {
    //         method: 'get'
    //     })
    //     console.log(response);
    //     expect(response.status).to.equal(400);
    //     const json = await response.json();
    //     expect(json.success).to.equal(true);
        
    // });
});

after(async function() {
    //await db.collection("create_password_token").deleteMany({ id: { $in: idOfTokenToRemove } });
    await db.collection("clients").deleteMany({id: { $in: usersToRemove }});
});

// it('Main page content', function(done) {
//     fetch('https://kompar-api-se.herokuapp.com/password', {
//         method: 'post',
//         body:    JSON.stringify({"dsada": "aaa"}),
//         headers: { 'Content-Type': 'application/json' },
//     })
//     .then(res => res.json())
//     .then(json => console.log(json));
//     console.log(a);
// });

// const jwt = require('jsonwebtoken');

// const ALGORITHM = "HS256";

// const claims = {
//     //iat:  Date.now()
// }

// const options = {
//     expiresIn: '60s',
//     algorithm:  ALGORITHM
// };

// const token = jwt.sign(claims, "secret", options);
// console.log(token);

// const options2 = {
//     algorithm:  ALGORITHM
// };

// const a = jwt.verify(token, "secret", options2);
// console.log(a);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 3000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 5000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 8000);

// setTimeout(function() {
//     const aa = jwt.verify(token, "secret", options2);
// console.log(aa);
// }, 11000);

// setTimeout(function() {
//     try {
//         const aa = jwt.verify(token, "secret", options2);
//         console.log(aa);
//     } catch(error) {
//         console.log(error);
//     }
    
// }, 15000);

// setTimeout(function() {
//     try {
//         const aa = jwt.verify(token, "secret", options2);
//         console.log(aa);
//     } catch(error) {
//         console.log(error);
//     }
    
// }, 61000);