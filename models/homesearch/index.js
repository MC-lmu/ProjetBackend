'use strict';

const mongoose = require('mongoose')

/** Objet exemple
  {
    "code_postal": 72100,
    "DPE": "B",
    "GES": "A",
    "surface": 180,
    "surface_max": 210,
  }
 */

const Schema = new mongoose.Schema({
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

module.exports = Schema