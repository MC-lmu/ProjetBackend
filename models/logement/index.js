'use strict';

const mongoose = require('mongoose')
const COLLECTION_NAME = process.env.COLLECTIONS_PREFIX + "logements"

/** Objet exemple
  {
    "_id":{"$oid":"656082c21941e30e2d6d035c"},
    "N°_département_(BAN)": 72,
    "Date_réception_DPE":"2023-04-20",
    "Date_établissement_DPE":"2023-04-20",
    "Date_visite_diagnostiqueur":"2023-04-11",
    "Etiquette_GES":"A",
    "Etiquette_DPE":"A",
    "Année_construction": 1945,
    "Surface_habitable_logement": 192.7,
    "Adresse_(BAN)":"Lieu Dit la Grande Corbiniere 72300 Souvigné-sur-Sarthe",
    "Code_postal_(BAN)": 72300
  }
 */

const Schema = new mongoose.Schema({
    'N°_département_(BAN)': { type: Number, required: true },
    'Date_réception_DPE': { type: Date, required: true },
    'Date_établissement_DPE': { type: Date, required: true },
    'Date_visite_diagnostiqueur': { type: Date, required: true },
    'Etiquette_GES': { type: String, required: true },
    'Etiquette_DPE': { type: String, required: true },
    'Année_construction': { type: Number },
    'Surface_habitable_logement': { type: Number, required: true },
    'Adresse_(BAN)': { type: String, required: true },
    'Code_postal_(BAN)': { type: Number, required: true }
})

Schema.virtual('front').get(function () {
    return {
        _id: this._id,
        departement: this['N°_département_(BAN)'],
        adresse: this['Adresse_(BAN)'],
        code_postal: this['Code_postal_(BAN)'],

        score_GES: this['Etiquette_GES'],
        score_DPE: this['Etiquette_DPE'],

        annee_construction: this['Année_construction'],
        surface_habitable: this['Surface_habitable_logement'],

        date_visite: this['Date_visite_diagnostiqueur'],
        date_etablissement_DPE: this['Date_établissement_DPE'],
        date_reception_DPE: this['Date_réception_DPE']
    }
})

module.exports = mongoose.model(COLLECTION_NAME, Schema)