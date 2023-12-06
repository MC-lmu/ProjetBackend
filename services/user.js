'use strict';
const log = require('debug')('backend:services:users')
const AuthService = require('./auth')
const User = require('../models/user')
const Search = require('../models/homesearch')
const { BadRequestError, ServerError } = require('../types/ExtError')

exports.authenticate = (user, plainPassword) => {
    log('Authenticating "%s" with password "%s"...', user.email, plainPassword)
    if (!user || !user.email || !plainPassword)
        return false

    return AuthService.verifyPassword(plainPassword, user.passwordHash, user.passwordSalt)
}

exports.createUser = async function(userData) {
    if (!userData.name || !userData.email || !userData.password) {
        return Promise.reject(BadRequestError('One or more required fields are missing'))
    }

    var userProfile = {
        name: userData.name,
        email: userData.email,
    }

    //Check if user already exists
    try {
        const existingUser = await User.findOne({ 'email': userData.email })
        if (existingUser) {
            log('Tried to create an already existing user: ', existingUser.name)
            return Promise.reject(BadRequestError('This e-mail address is already registered'))
        }
    } catch (e) {
        return Promise.reject(ServerError(e.message));
    }

    //Encrypt password
    const salt = AuthService.generateSalt()
    userProfile.passwordSalt = salt;
    userProfile.passwordHash = AuthService.hashPassword(userData.password, salt)
    if (!userProfile.passwordHash) {
        return Promise.reject(ServerError('Failed to encrypt password'))
    }

    //Verify that the user object is correct then add to database
    const newUser = new User(userProfile)
    if (newUser.validateSync()) {
        return Promise.reject(ServerError('Failed validation of User object'))
    }
    return newUser.save()
}

exports.getUser = async function(email) {
    if (!email) {
        log('getUser(): no email provided')
        return undefined
    }

    try {
        return await User.findOne({ "email": email })
    } catch (error) {
        log('Error searching for user: ' + error)
        return undefined
    }
}

exports.deleteUser = async function(user) {
    log('Deleting user "%j"...', user)

    try {
        await User.findByIdAndDelete(user._id).catch( err => {
            throw new Error("Failed user deletion: " + err);
        })

        //TODO: use publisher/subscriber model
        await Search.deleteMany({ userId: user._id }).catch( err => {
            throw new Error("Failed searches deletion: " + err);
        })
    } catch (err) {
        return Promise.reject(ServerError(err.message, err));
    }
}
