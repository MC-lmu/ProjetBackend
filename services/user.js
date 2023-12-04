'use strict';
const log = require('debug')('backend:services:users')
const AuthService = require('./auth')
const User = require('../models/user')
const Search = require('../models/homesearch')

exports.authenticate = (user, plainPassword) => {
    log('Authenticating "%s" with password "%s"...', user.email, plainPassword)
    if (!user || !user.email || !plainPassword)
        return false

    return AuthService.verifyPassword(plainPassword, user.passwordHash, user.passwordSalt)
}

exports.createUser = async function(user) {
    if (!user.name || !user.email || !user.password) {
        return Promise.reject(new Error('Missing required fields'))
    }

    //Check if user already exists
    try {
        const existingUser = await User.findOne({ 'email': user.email })
        if (existingUser) {
            log('Tried to create an already existing user: ', existingUser.name)
            throw new Error('User already exists')
        }
    } catch (error) {
        throw error;
    }

    //Encrypt password
    user.passwordSalt = AuthService.generateSalt()
    const hashedPassword = AuthService.hashPassword(user.password, user.passwordSalt)
    if (!hashedPassword) {
        throw new Error('Failed to encrypt password')
    }
    user.passwordHash = hashedPassword

    //Verify that the user object is correct then add to database
    const newUser = new User(user)
    return newUser.save()
}

exports.getUser = async function(email) {
    if (!email) {
        log('getUser(): no email provided')
        return undefined
    }

    try {
        return User.findOne({ "email": email })
    } catch (error) {
        log('Error searching for user: ' + error)
        return undefined
    }
}

exports.deleteUser = async function(user) {
    log('Deleting user "%j"...', user)

    User.findByIdAndDelete(user._id).catch( err => {
        throw new Error("Failed user deletion: " + err);
    })

    //TODO: use publisher/subscriber model
    Search.deleteMany({ userId: user._id }).catch( err => {
        throw new Error("Failed searches deletion: " + err);
    })
}
