'use strict';

const log = require('debug')('backend:loaders:express')
const compression = require('compression')
const express = require('express')
const morgan = require('morgan')

const { ExtError, HttpError, ErrorKinds } = require('../types/ExtError')

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
//Catch all unhandled requests and turn them into 404 errors
app.use((req, res, next) => next(HttpError(404, "Page not found")))

//Generic error handler
app.use((err, req, res, next) => {
    const devEnv = req.app.get('env') === 'development';
    const replyInJson = req.get('Content-Type')?.includes("application/json") ||
        req.get('Accept')?.includes("application/json");

    const isExtError = (err instanceof ExtError);
    if (!isExtError) {
        if (!err.status && !err.statusCode) {
            const msg = (devEnv) ? err.message : "Internal Server Error";
            if (replyInJson) {
                return res.status(500).json({ message: msg })
            } else {
                return res.status(500).send(msg);
            }
        } else {
            err.getStatusCode = function() {
                return this.status ?? this.statusCode;
            }
        }
    }

    const statusCode = err.getStatusCode() ??
        (err.kind === ErrorKinds.kNotFound) ? 404 :
        (err.kind === ErrorKinds.kBadRequest) ? 400 :
        500;

    const serverError = (500 <= statusCode && statusCode < 600)
    
    //Redact server error messages outside of dev environment
    if (req.app.get('env') !== 'development' && serverError) {
        err.message = "An internal server error occurred.";
    }

    if (replyInJson) {
        res.status(statusCode).json({ message: err.message });
    } else {
        res.status(statusCode).send(err.message);
    }
})

module.exports = app