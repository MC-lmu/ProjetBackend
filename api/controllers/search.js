'use strict';

const SearchService = require("../../services/search")

exports.newSearch = function(req, res, next) {
    SearchService.executeNewSearch(req.user._id, req.body, (err, data) => {
        if (err) {
            return next(err);
        }
        return res.status(200).json(data);
    })
}

exports.existingSearch = function(req, res, next) {
    SearchService.executeExistingSearch(req.user._id, req.params.id, (err, data) => {
        if (err) {
            return next(err)
        }
        return res.status(200).json(data)
    })
}
