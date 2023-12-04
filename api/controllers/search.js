'use strict';

const HttpError = require('http-errors')
const SearchService = require("../../services/search")

exports.newSearch = function(req, res, next) {
    try {
        SearchService.executeNewSearch(req.user._id, req.body, (err, data) => {
            if (err) {
                return next(HttpError(500, err))
            }
            return res.status(200).json(data)
        })
    } catch(err) {
        return next(HttpError(400, err.message))
    }
}

exports.existingSearch = function(req, res, next) {
    const searchId = req.body?.searchId;
    if (!searchId) {
        return next(HttpError(400, 'No search ID provided'))
    }

    try {
        SearchService.executeExistingSearch(req.user._id, searchId, (err, data) => {
            if (err) {
                return next(HttpError(500, err.message))
            }
            return res.status(200).json(data)
        })
    } catch(err) {
        return next(HttpError(400, err.message))
    }
}
