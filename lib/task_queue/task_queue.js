// @ts-check

'use strict';

const ObjectId = require("mongodb").ObjectID;
const timeConfig = require('../config/timeConfig');
const config = require('../config');

function createTaskObject(type, date, variables) {
    return {
        "insert_date_UTC": Date.now(),
        "insert_date": timeConfig.toCorrectZone(Date.now()),
        "insert_date_text": timeConfig.dateToTextLong(timeConfig.toCorrectZone(Date.now())),
        "launched_date_UTC": date,
        "launched_date": timeConfig.toCorrectZone(date),
        "launched_date_text": timeConfig.dateToTextLong(timeConfig.toCorrectZone(date)),
        "isStarted": false,
        "type": type,
        "variables": variables
    }
}

async function queueTask(db, type, date, variables) {
    const { insertedId } = await db.collection(config.db.task_queue).insertOne(createTaskObject(type, date, variables));
    return insertedId;
}

async function updateTask(db, type, date, variables, taskId) {
    await db.collection(config.db.task_queue).replaceOne({ _id: new ObjectId(taskId) }, createTaskObject(type, date, variables));
}

async function deleteTask(db, taskId) {
    await db.collection(config.db.task_queue).deleteOne({ _id: new ObjectId(taskId) });
}

async function deleteTaskWithDetails(db, details) {
    const type = details.type;
    const client_id = details.client_id;
    await db.collection(config.db.task_queue).deleteOne({
        type: type,
        "variables.client_id": client_id
    });
}

async function deleteTaskVariable(db, what) {
    await db.collection(config.db.task_queue).deleteOne(what);
}

const task_queue_type = {
    delay: "delay"
}

module.exports = {
    async queueTask(db, type, date, variables) {
        return queueTask(db, type, date, variables);
    },
    updateTask(db, type, date, variables, taskId) {
        return updateTask(db, type, date, variables, taskId);
    },
    deleteTask(db, taskId) {
        return deleteTask(db, taskId);
    },
    deleteTaskWitDetails(db, details) {
        return deleteTaskWithDetails(db, details);
    },
    deleteTaskVariable(db, what) {
        return deleteTaskVariable(db, what);
    },
    type: task_queue_type
};