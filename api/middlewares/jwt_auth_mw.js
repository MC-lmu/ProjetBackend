'use strict';

const jwt = require('jsonwebtoken')

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

exports.authenticateToken = function(req, res, next) {
    //Authorization header is of the form: "Authorization: Bearer <token>"
    //Extract the token from header
    const token = req.headers['authorization']?.split('Bearer ')?.[1];
    if (!token) {
        return res.sendStatus(401)
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            return res.sendStatus(401);
        }

        req.user = payload;
        next();
    });
}