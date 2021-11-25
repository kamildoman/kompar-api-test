// @ts-check

'use strict';

const taskRunners = {};

const task_queue = require('./task_queue');

module.exports = {
    addTaskRunner (type, handler) {
        if (taskRunners[type]) {
            throw `Runner was already defined for type: ${type}`;
        }
        taskRunners[type] = handler;
    },
    async runTask (req, res, db, task, test, websockets) {
        const runner = taskRunners[task.type];
        if (!runner) {
            throw `Runner not defined for task type: ${task.type}`;
        }
        await runner(req, res, db, task.variables, test, websockets);
    }
}