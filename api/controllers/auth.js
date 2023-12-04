'use strict';

const jwt = require('jsonwebtoken')
const HttpError = require('http-errors')
const AuthService = require('../../services/auth')
const UserService = require('../../services/user')

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET

exports.login = async function(req, res, next) {
    const user = await UserService.getUser(req.body?.email)
    if (!user) {
        return next(HttpError(400, "Invalid credentials"))
    }

    if (!UserService.authenticate(user, req.body?.password)) {
        return next(HttpError(400, "Invalid credentials"))
    }

    const accessToken = AuthService.generateAccessToken(user.front)
    const refreshToken = AuthService.generateRefreshToken(user.front)
    return res.status(200).json({
        accessToken, refreshToken
    })
}

exports.refreshToken = async function(req, res, next) {
    //"Authorization: Bearer <token>"
    const token = req.headers['authorization']?.split('Bearer: ')?.[1]
    if (!token) {
        return res.sendStatus(401)
    }

    jwt.verify(token, REFRESH_SECRET, async (err, payload) => {
        if (err) {
            return res.sendStatus(401)
        }

        //TODO: check if the refresh token has been revoked,
        //if the user is still allowed to authenticate, etc
        const user = await UserService.getUser(payload.email)
        if (!user) {
            return next(HttpError(400, "Invalid credentials"))
        }

        const newAccessToken = AuthService.generateAccessToken(user.front)
        return res.status(200).json({
            accessToken: newAccessToken 
        })
    })    
}