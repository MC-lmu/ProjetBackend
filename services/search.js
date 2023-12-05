'use strict';

const log = require('debug')('backend:services:search')
const Logements = require('../models/logement')
const Search = require('../models/homesearch')
const https = require('https');
const { isValidObjectId } = require('mongoose');

const MAX_RESULTS_NUM = process.env.MAX_SEARCH_RESULTS

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
            return callback(null, data)
        }

        const homeAddress = data['Adresse_(BAN)'];

        //Call external API to obtain geographical data
        //TODO: this is broken
        const options = {
            host: 'nominatim.openstreetmap.org',
            path: '/search?format=json&limit=1&q=' + encodeURI(homeAddress),
            headers: {
                'Content-Type': 'application/json',
                'User-Agent' : 'DPEApp/1.00'
            }
        }

        https.get(options, resp => {
            var httpData = "";

            resp.on('data', chunk => httpData += chunk)
            resp.on('end', () => {
                try {
                    const apiResponse = JSON.parse(httpData)
                    if (!apiResponse) {
                        return callback(null, null)
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
                    callback(err.message, null)
                }
            })
        }).on('error', (e) => callback('Nominatim API request error: ' + e, null))
    }).catch( err => {
        if (err) {
            callback(err, null)
        }
    })
}

//Throws if the searchCriteria is invalid
exports.executeNewSearch = function(userId, searchCriteria, callback) {
    searchCriteria.userId = userId;
    const searchObject = new Search(searchCriteria)

    //Catch malformed object before attempting to save
    //to be able to catch the exception without async code
    const error = searchObject.validateSync()
    if (error != null) {
        throw error;
    }

    searchObject.save()

    performSearch(searchObject, callback)
}

//Throws if the search ID doesn't correspond to an existing search,
//or if the search doesn't correspond to the user
exports.executeExistingSearch = function(userId, searchId, callback) {
    if (!isValidObjectId(searchId)) {
        throw new Error('Malformed search ID')
    }

    try {
        Search.findById(searchId).then(search => {
            //Process non-existing seaches and searches belonging to
            //another user the same way in order to not leak information
            if (!search || search.userId.toString() !== userId.toString())
                return callback(null, null) //HACK

            performSearch(search, callback)
        })
    } catch (err) {
        throw err;
    }
}
