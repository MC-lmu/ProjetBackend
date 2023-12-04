'use strict';

const HttpError = require('http-errors')
const Users = require('../../models/user')
const UserService = require("../../services/user")

exports.create = async function(req, res, next) {
    const user = req.body;
    try {
        const createdUser = await UserService.createUser(user);
        return res.status(201).json(createdUser.front)
    } catch (err) {
        return next(HttpError(400, err.message))
    }
}

function runForUser(userId, callback) {
    Users.findById(userId).then( data => {
        if (data == null) {
            return next(HttpError(404, 'no user found with this ID'))
        }
        return callback(data)
    }).catch(err => {
        if (err) {
            return next(HttpError(500, err))
        }
    })
}

exports.getSelf = function(req, res, next) {
    runForUser(req.user._id, data => {
        return res.status(200).json(data.front)
    })
}

exports.getSearchHistory = function(req, res, next) {
    runForUser(req.user._id, data => {
        return res.status(200).json(data.searchHistory)
    })
}