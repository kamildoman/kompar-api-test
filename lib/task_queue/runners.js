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
    async runTask (configuration, req, res, db, task, test, websockets) {
        const runner = taskRunners[task.type];
        if (!runner) {
            throw `Runner not defined for task type: ${task.type}`;
        }
        if (task.type === task_queue.type.new_application_holiday || task.type === task_queue.type.new_form_finish) {
            await runner(configuration, req, res, db, task.variables, test, websockets);
        } else if (task.type === task_queue.type.email || task.type === task_queue.type.email_template) {
            await runner(db, task.variables);
        } else if (task.type === task_queue.type.sms) {
            await runner(configuration, db, task.variables, test);
        } else {
            await runner(res, db, task.variables, test, websockets);
        }
    }
}