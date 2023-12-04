'use strict';

require('dotenv').config({
    path: './.env',
    example: './.env.example'
});
const log = require('debug')('backend:server')
log("Server stating...")

const mongoose = require('./loaders/mongoose')
const app = require('./loaders/express')
const http = require('http')

const DEFAULT_PORT = '3000'

function normalizePort(s) {
    const port = parseInt(s, 10)
    if (isNaN(port)) { //Named pipe
        return s
    }

    if (port >= 0) {
        return port
    }

    return false;
}

async function startServer() {
    // Connect to database
    await mongoose.connect()

    // Get server port from environement and set in Express
    const port = normalizePort(process.env.PORT ?? DEFAULT_PORT)
    app.set('port', port)

    // Create HTTP server
    const server = http.createServer(app)

    // Start server & listen on port
    server.listen(port)
    server.on('error', onError)
    server.on('listening', onListening)

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }
    
        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;
    
        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
            default:
                throw error;
        }
    }
    
    function onListening() {
        const addr = server.address();
        const bind = (typeof addr === 'string') ? ('pipe ' + addr) : ('port ' + addr.port);
        log('Server started!')
        log('Listening on ' + bind + '...');
    }
}

startServer()