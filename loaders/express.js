'use strict';

const log = require('debug')('backend:loaders:express')
const compression = require('compression')
const HttpError = require('http-errors')
const express = require('express')
const morgan = require('morgan')

const apiRouter = require('../api/routes')

log('Creating application...')
const app = express()
app.disable('x-powered-by')

log('Adding middleware filters...')
app.use(morgan('dev'))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

log('Adding routes...')
app.use('/api/v1', apiRouter)

log('Adding last-in-chain handlers...')
//Catch all unhandled requests
//and turn them into 404 errors
app.use((req, res, next) => next(HttpError(404)))

//Generic error handler
app.use((err, req, res, next) => {
    const statusCode = err.status ?? 500
    const userError = (400 <= statusCode && statusCode < 500)
    const replyInJson = req.get('Content-Type')?.includes("application/json") ||
        req.get('Accept')?.includes("application/json");

    //Redact server error messages outside of dev environment
    if (req.app.get('env') !== 'development' && !userError) {
        err.message = "An internal server error occurred.";
    }

    if (replyInJson) {
        res.status(statusCode).json({ error: err.message });
    } else {
        res.status(statusCode).send(err.message);
    }
})

module.exports = app