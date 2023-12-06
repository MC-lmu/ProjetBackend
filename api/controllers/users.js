'use strict';

const Users = require('../../models/user')
const UserService = require("../../services/user")
const Searches = require('../../models/homesearch')
const { ServerError, NotFoundError } = require('../../types/ExtError')

exports.create = function(req, res, next) {
    UserService.createUser(req.body).then( createdUser => {
        return res.status(201).json(createdUser.front)
    }).catch( err => {
        return next(err)
    })
}

function searchUserByIdAndExec(userId, next, callback) {
    Users.findById(userId).then( user => {
        if (user == null) {
            return next(NotFoundError('No user with provided ID exists'))
        }
        return callback(user)
    }).catch(err => {
        if (err) {
            return next(ServerError('Error while searching for user', err))
        }
    })
}

exports.getSelf = function(req, res, next) {
    searchUserByIdAndExec(req.user._id, next, user => {
        return res.status(200).json(user.front)
    })
}

exports.getSearchHistory = function(req, res, next) {
    searchUserByIdAndExec(req.user._id, next, user => {
        Searches.find({ 'userId': user._id }).then( data => {
            return res.status(200).json(data)
        }).catch( err => {
            return next(ServerError('Error while obtaining search history', err))
        })
    })
}