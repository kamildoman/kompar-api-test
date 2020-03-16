'use strict';

const colors = require('colors/safe');

class Logger {
    error(message) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.red("---> START ERROR <---"));
        console.log(message);
        console.log(colors.red("---> END ERROR <---"));
        colors.disable();
    };
    
    warning(message) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.blue("---> START WARNING <---"));
        console.log(message);
        console.log(colors.blue("---> END WARNING <---"));
        colors.disable();
    };
    
    info(message) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.green("---> START INFO <---"));
        console.log(message);
        console.log(colors.green("---> END INFO <---"));
        colors.disable();
    };
    
    request(req) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.yellow("---> START REQUEST INFO <---"));
        console.log(`Request: ${req.method}, ${req.url}, Headers: ${JSON.stringify(req.headers)}, Params: ${JSON.stringify(req.params)}, Body: ${JSON.stringify(req.body)}`);
        console.log(colors.yellow("---> END REQUEST INFO <---"));
        colors.disable();
    }

    requestNoBody(req, msg) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.brightYellow("---> START REQUEST INFO <---"));
        console.log(`Request: ${req.method}, ${req.url}, Headers: ${JSON.stringify(req.headers)}, Params: ${JSON.stringify(req.params)}, ${msg}`);
        console.log(colors.brightYellow("---> END REQUEST INFO <---"));
        colors.disable();
    }

    requestStatic(msg) {
        if (process.env.AUTOMATIC_TESTING == 1) return;
        colors.enable();
        console.log(colors.brightYellow("---> START REQUEST INFO <---"));
        console.log(`Request - Path: ${msg}`);
        console.log(colors.brightYellow("---> END REQUEST INFO <---"));
        colors.disable();
    }
}

const logger = new Logger();
module.exports = logger;