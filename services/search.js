'use strict';

const log = require('debug')('backend:services:search')
const Logements = require('../models/logement')
const Searches = require('../models/homesearch')
const http = require('http');
const { isValidObjectId } = require('mongoose');
const { 
    NotFoundError,
    BadRequestError,
    ServerError
} = require('../types/ExtError')

function performSearch(search, callback) {
    var criterias = [
        { "Code_postal_(BAN)": search.code_postal},
        { "Etiquette_DPE": search.DPE},
        { "Etiquette_GES": search.GES},
    ];

    if (search.date) {
        criterias.push({ $or: [
            { "Date_visite_diagnostiqueur": search.date },
            { "Date_visite_diagnostiqueur": search.date },
            { "Date_réception_DPE": search.date }, 
        ]})
    }

    //Check if user wants to perform a range-based or exact-match search
    if (search.surface_max) {
        criterias.push({ "Surface_habitable_logement": {
                $gte: search.surface,
                $lte: search.surface_max
            }
        })
    } else { //Exact-match (rounded to integer part)
        criterias.push({ "Surface_habitable_logement": {
                $gte: Math.floor(search.surface),
                $lt: Math.floor(search.surface) + 1
            }
        })
    }

    //Find matching homes in the database
    Logements.findOne({ $and: criterias }).then( data => {
        if (data === null) {
            return callback(null, {})
        }

        const homeAddress = data['Adresse_(BAN)'];
        log("Found a matching home @ %s", homeAddress)

        //Call external API to obtain geographical data
        const options = {
            host: 'nominatim.openstreetmap.org',
            path: '/search?format=json&limit=1&q=' + encodeURI(homeAddress),
            headers: {
                //'Content-Type': 'application/json',
                'User-Agent' : 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.22000.2003'
            }
        }

        log("Sending HTTP GET to '%s%s'...", options.host, options.path)

        http.get(options, resp => {
            var httpData = "";

            resp.on('data', chunk => httpData += chunk)
            resp.on('end', () => {
                try {
                    const apiResponse = JSON.parse(httpData)
                    if (!apiResponse) {
                        return callback(null, {})
                    }
                    //OpenStreetMap API returns an array of matches.
                    //Assume that the first (and usually only) element
                    //has the data we're expecting.
                    const homeDetails = apiResponse[0];
 
                    return callback(null, {
                        address: homeAddress,
                        lat: parseFloat(homeDetails.lat),
                        lon: parseFloat(homeDetails.lon)
                    })
                } catch (err) {
                    callback(ServerError(err.message), null)
                }
            })
        }).on('error', e => {
            callback(NotFoundError('Failed Geoloc data fetch from Nominatim API: ' + e), null)
        })
    }).catch( err => {
        callback(ServerError(err.message), null)
    })
}

exports.executeNewSearch = function(userId, searchParameters, callback) {
    const objDescriptor = {
        code_postal: searchParameters.code_postal,
        DPE: searchParameters.DPE,
        GES: searchParameters.GES,

        surface: searchParameters.surface,
        surface_max: searchParameters.surface_max,
        
        date: searchParameters.date,

        userId
    };

    //Check if an identical search already exists
    //If so, don't actually create a new search
    Searches.findOne(objDescriptor).then( existingSearch => {
        if (!existingSearch) { //No existing - create new
            const searchObject = new Searches(objDescriptor)
            
            //Catch malformed object before attempting to save
            //to be able to catch the exception without async code
            const error = searchObject.validateSync()
            if (error != null) {
                return callback(BadRequestError("Invalid search criteria: " + error))
            }

            //This *should* never fail due to previous validation
            searchObject.save()

            performSearch(searchObject, callback)
        } else {
            log('Found existing search for %o', objDescriptor)
            performSearch(existingSearch, callback)
        }
    })
}

exports.executeExistingSearch = function(userId, searchId, callback) {
    if (!isValidObjectId(searchId)) {
        return callback(BadRequestError("Malformed search ID"), null)
    }

    Searches.findById(searchId).then(searchObject => {
        //Process non-existing seaches and searches belonging to
        //another user the same way in order to not leak information
        if (!searchObject || searchObject.userId.toString() !== userId.toString()) {
            return callback(NotFoundError("No search with provided ID exists"), null)
        }

        performSearch(searchObject, callback)
    })
}

exports.deleteSearch = function(userId, searchId, callback) {
    if (!isValidObjectId(searchId)) {
        return callback(BadRequestError("Malformed search ID"), null)
    }

    Searches.findById(searchId).then( searchObject => {
        if (!searchObject || searchObject.userId.toString() !== userId.toString()) {
            return callback(NotFoundError("No search with provided ID exists"), null)
        }

        searchObject.deleteOne().then( res => {
            if (res.acknowledged) {
                return callback(null, null)
            } else {
                return callback(ServerError("Deletion was not acknowledged"), null)
            }
        })
    })
}