'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const fetch = require("node-fetch");
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');

const expect = require("chai").expect;

const config = require("./config")

//////
var db;
var secret = "any_secret";
var idOfUser = "";

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

        console.log(`User - id: ${id}, name: ${name}, login: ${login} has been added.`);
        
        const claims = {
            id:  id,
            iat:  Date.now()
        }

        const expiresIn = Date.now() + 10800000; // 3 hours
        const options = {
            algorithm:  "HS256"
        };

        const tokenForPassword = jwt.sign(claims, secret, options);
        
        await db.collection("create_password_token").insertOne({
            id: id,
            token: tokenForPassword,
            expiresIn: expiresIn
        });

        console.log("Create password token has been added.");
        idOfUser = id;
    } catch(error) {

    }
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

        const token = jwt.sign(claims, secret, options);

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
    it('## Should 404 (wrong token - no in database)', async function() {
        const id = uuidv4();
        
        const claims = {
            id:  id,
            iat:  Date.now()
        }

        const options = {
            algorithm:  "HS256"
        };

        const s = "054651db5112578a83e327e00408836ec743aabfa248cb7131353709e2b44c6297ef71afb7d91b8bbbfda8a4b9a7aee52dd5dca8ab25bee39282546f9e7c4712fc1fe9279a451e0aee363f993eaab04a243c5e9a6e1bb4bffe15e95e40904d1e7317dbe60432693dce745e5df1595c0e180402059c28636733bb59ee4557457d";
        const token = jwt.sign(claims, s, options);

        const response = await fetch('https://kompar-api-se.herokuapp.com/test/password', {
            method: 'post',
            body:    JSON.stringify({ 
                "password": "any password",
                "token": token
            }),
            headers: { "Content-type": "application/json" }
        })
        console.log(response);
       // expect(response.status).to.equal(403);
        const json = await response.json();
        console.log(json);
      //  expect(json.message).to.equal("You have no permission to change password.");
    });
});

after(async function() {
    await db.collection("create_password_token").deleteMany({});
    await db.collection("clients").deleteMany({});
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