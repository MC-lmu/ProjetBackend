'use strict';

const log = require('debug')('backend:services:search')
const Logements = require('../models/logement')
const Search = require('../models/homesearch')
const https = require('https')

const MAX_RESULTS_NUM = process.env.MAX_SEARCH_RESULTS

function performSearch(search, callback) {
    var criterias = [
        { "Code_postal_(BAN)": { $eq: search.code_postal }},
        { "Etiquette_DPE": { $eq: search.DPE }},
        { "Etiquette_GES": { $eq: search.GES }},
    ];

    if (search.date) {
        criterias.push({ $or: [
            { "Date_visite_diagnostiqueur": { $eq: search.date }},
            { "Date_visite_diagnostiqueur": { $eq: search.date }},
            { "Date_réception_DPE": { $eq: search.date }}, 
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
                $gte: search.surface,
                $lt: search.surface
            }
        })
    }

    log("search criterias: %j", criterias)

    //Find matching homes in the database
    Logements.find({ $and: criterias }).then( data => {
        log("Search results: %j", data)
        if (data === null) {
            return callback(null, data)
        }

        //Call external API to obtain geographical data
        //TODO: this is broken
        const options = {
            host: 'nominatim.openstreetmap.org',
            path: '/search?format=json&limit=1&q=' + encodeURI(data[0]['Adresse_(BAN)']),
            headers: { 'Content-Type': 'application/json'}
        }

        log("request: %s%s", options.host, options.path)

        https.get(options, resp => {
            var httpData = "";

            resp.on('data', chunk => httpData += chunk)
            resp.on('end', () => {
                try {
                    const api_data = JSON.parse(httpData)
                    if (!api_data) {
                        return callback(null, null)
                    } else {
                        return callback(null, {
                            address: data[0]['Adresse_(BAN)'],
                            lat: httpData[0].lat,
                            lon: httpData[0].lon
                        })
                    }
                } catch (err) {
                    callback(err.message, null)
                }
            })
        }).on('error', (e) => callback('API request error: ' + e, null))
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
    searchObject.save()

    performSearch(searchObject, callback)
}

//Throws if the search ID doesn't correspond to an existing search,
//or if the search doesn't correspond to the user
exports.executeExistingSearch = function(userId, searchId, callback) {
    Search.findById(searchId).then(search => {
        //Use the same message when search doesn't exist and when it exists
        //but not for this user in order to not leak information
        if (!search || search.userId !== userId)
            throw new Error('No search corresponds to ID')

        performSearch(search, callback)
    })
}
