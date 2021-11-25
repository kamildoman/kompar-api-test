// @ts-check

'use strict';

const ObjectId = require("mongodb").ObjectID;
const express = require('express');

const config = require('../config');
const logger = require('../logger');
const runners = require('./runners');

async function getTasksToStart(db) {
    return db.collection(config.db.task_queue)
        .find({
            launched_date_UTC: { $lt: Date.now() },
            isStarted: false
        })
        .toArray();
}

async function getSpecificTask(db, id) {
    return db.collection(config.db.task_queue)
        .findOne({
            _id: new ObjectId(id)
        })
}

async function getTasksToRemove(db) {
    return db.collection(config.db.task_queue)
        .find({
            launched_date_UTC: { $lt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
        })
        .toArray();
}

function scheduleTask(req, res, db, task, test, websockets) {
    return new Promise((resolve, reject) => {
        const timeDiff = task.launched_date_UTC - Date.now();
        logger.info(`TaskQueue -> scheduleTask: id: ${task._id} timeDiff: ${timeDiff}`);
        setTimeout(async () => {
            try {
                await runners.runTask(req, res, db, task, test, websockets);
                resolve();
            } catch (error) {
                reject(error);
            }
        }, timeDiff);
    });
}

async function markTasksAsStartedInDb(db, tasks) {
    await db.collection(config.db.task_queue).updateMany(
        { "_id": { $in: tasks.map((task) => task._id) } },
        { $set: { "isStarted": true } }
    );
}

async function scheduleTasksAndUpdateDbOnFinish(req, res, db, tasks, test, websockets) {
    const runningTasks = tasks.map((task) => ({ id: task._id, promise: scheduleTask(req, res, db, task, test, websockets) }));
    let failedTasks = [];
    for (const runningTask of runningTasks) {
        try {
            await runningTask.promise;
        } catch (error) {
            logger.error(`TaskQueue -> runningTaskFailed: id: ${runningTask.id} error: ${error}`);
            failedTasks.push(runningTask);
        }
    }

    const tasksToUpdate = [];
    for (const failed of failedTasks) {
        tasksToUpdate.push(failed.id);
    }
    await db.collection(config.db.task_queue).updateMany({ "_id": { $in: tasksToUpdate } }, { $set: { "isStarted": false } });

    const toRemove = await getTasksToRemove(db);
    const tasksToRemove = [];
    for (const removed of toRemove) {
        tasksToRemove.push(removed._id);
    }
    if (tasksToRemove.length > 0) {
        await db.collection(config.db.task_queue).deleteMany({ "_id": { $in: tasksToRemove } } );
    }
}

module.exports = {
    async execute(req, res, db, test, websockets) {
        const tasksToStart = await getTasksToStart(db);
        await markTasksAsStartedInDb(db, tasksToStart);
        scheduleTasksAndUpdateDbOnFinish(req, res, db, tasksToStart, test, websockets);
        return res.status(200).send({ "howManyStarted": tasksToStart.length });
    },
    async executeSingle(req, res, id, db, test, websockets) {
        const taskToStart = await getSpecificTask(db, id);
        await runners.runTask(req, res, db, taskToStart, test, websockets);
    }
}