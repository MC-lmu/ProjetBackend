'use strict';

const mongoose = require('mongoose')
const Search = require('../homesearch')
const COLLECTION_NAME = process.env.COLLECTIONS_PREFIX + "users"

/** Objet exemple
  {
    "name": "Jean-Michel Jarre",
    "email": "self@jmj.fr",
    "passwordHash": "4058cfd0383af73e7c7953e4fc5907bde3dafc53",
    "passwordSalt": "8c2015657e6a7420",
    "privileges": ["AdminPrivilege"]
  }
 */

const Schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    privileges: [String]
})

Schema.virtual('front').get(function() {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        privileges: this.privileges,
        searchHistory: this.searchHistory,
    }
})

module.exports = mongoose.model(COLLECTION_NAME, Schema)