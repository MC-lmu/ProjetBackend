'use strict';

const mongoose = require('mongoose')
const COLLECTION_NAME = process.env.COLLECTIONS_PREFIX + "recherches"

/** Objet exemple
  {
    "userId": "xxxxxxxx"
    "code_postal": 72100,
    "DPE": "B",
    "GES": "A",
    "surface": 180,
    "surface_max": 210,
  }
 */

const Schema = new mongoose.Schema({
    userId: { type: mongoose.ObjectId, required: true, index: true },
    code_postal: { type: Number, required: true },
    DPE: { type: String, required: true },
    GES: { type: String, required: true },

    //If this is the only field present: exact match
    //If surface_max is also present: minimal surface
    surface: { type: Number, required: true },
    surface_max: { type: Number },

    //Must match one of the three dates
    date: { type: Date }
})

Schema.virtual('front').get(function () {
    return {
      _id: this._id,
      code_postal: this.code_postal,
      DPE: this.DPE,
      GES: this.GES,
      surface: this.surface,
      surface_max: this.surface_max,
      date: this.date
    }
})

module.exports = mongoose.model(COLLECTION_NAME, Schema)