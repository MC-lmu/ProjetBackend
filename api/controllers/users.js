'use strict';

const HttpError = require('http-errors')
const Users = require('../../models/user')
const UserService = require("../../services/user")
const Searches = require('../../models/homesearch')

exports.create = async function(req, res, next) {
    const user = req.body;
    try {
        const createdUser = await UserService.createUser(user);
        return res.status(201).json(createdUser.front)
    } catch (err) {
        return next(HttpError(400, err.message))
    }
}

function runForUser(userId, next, callback) {
    Users.findById(userId).then( user => {
        if (user == null) {
            return next(HttpError(404, 'no user found with this ID'))
        }
        return callback(user)
    }).catch(err => {
        if (err) {
            return next(HttpError(500, err))
        }
    })
}

exports.getSelf = function(req, res, next) {
    runForUser(req.user._id, next, user => {
        return res.status(200).json(user.front)
    })
}

exports.getSearchHistory = function(req, res, next) {
    runForUser(req.user._id, next, user => {
        Searches.find({ 'userId': user._id }).then( data => {
            return res.status(200).json(data)
        }).catch( err => {
            return next(HttpError(500, err))
        })
    })
}