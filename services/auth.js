'use strict';

const log = require('debug')('backend:services:auth')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const ACCESS_TOKEN = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN_SECRET
const ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS)
const KEYLEN = parseInt(process.env.PBKDF2_KEY_LENGTH)
const SALT_LENGTH = parseInt(process.env.PASSWORD_SALT_LENGTH)
const ACCESS_TOKEN_TIMEOUT = process.env.ACCESS_TOKEN_TIMEOUT
const REFRESH_TOKEN_TIMEOUT = process.env.REFRESH_TOKEN_TIMEOUT

exports.generateSalt = function() {
    return crypto.randomBytes(SALT_LENGTH).toString('base64')
}

function hashPassword(password, salt) {
    log('Hashing password (%s) + salt (%s)...', password, salt)

    if (!password || !salt)
        return undefined

    salt = Buffer.from(salt, 'base64')
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, 'sha256').toString('base64')
}

exports.hashPassword = hashPassword;

exports.verifyPassword = function(plaintext, hashed, salt) {
    return hashed === hashPassword(plaintext, salt)
}

exports.generateAccessToken = function(payload) {
    log('Generating access token for "%j"...', payload)
    return jwt.sign(payload, ACCESS_TOKEN, { expiresIn: ACCESS_TOKEN_TIMEOUT });
}

exports.generateRefreshToken = function(payload) {
    log('Generating refresh token for "%j"...', payload)
    return jwt.sign(payload, REFRESH_TOKEN, { expiresIn: REFRESH_TOKEN_TIMEOUT });
}