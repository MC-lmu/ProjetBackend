'use strict';

const router = require('express').Router()
const searchController = require('../controllers/search')
const authMW = require('../middlewares/jwt_auth_mw')

router.get('/new', authMW.authenticateToken, searchController.newSearch)
router.get('/existing', authMW.authenticateToken, searchController.existingSearch)

module.exports = router