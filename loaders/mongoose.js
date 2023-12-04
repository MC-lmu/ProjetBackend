'use strict';

const log = require('debug')('backend:loaders:mongoose')
const mongoose = require('mongoose')

// Set strictQuery to false for mongoose 7 readyness
mongoose.set('strictQuery', false);

// Exit application on error
mongoose.connection.on('error', (err) => {
    log(`MongoDB connection error: ${err}`)
    process.exit(-1)
})

// Print mongoose logs in dev env
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true)
}

exports.connect = async function() {
    log('Connecting to Mongo database...')
    const databaseURL = process.env.MONGODB_URL;

    try {
        await mongoose.connect(databaseURL)

        mongoose.connection.on('disconnected', error => {
            const reason = error?.reason;
            log('ERROR: disconnected')
            log(error)
            if (reason) {
                log('Reason: %s', reason)
            }
        })

        mongoose.connection.on('reconnected', error => {
            const reason = error?.reason;
            log('INFO: reconnected')
            log(error)
            if (reason) {
                log('Reason: %s', reason)
            }
        })

        mongoose.connection.on('error', error => {
            const reason = error?.reason;
            log('ERROR: ' + error)
            if (reason) {
                log('Reason: %s', reason)
            }
        })
    } catch (e) {
        log('Failed connection to Mongo database: ' + JSON.stringify(e))
        process.exit(1)
    }

    log('Connected to Mongo database!')
}