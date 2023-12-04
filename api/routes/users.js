'use strict';

const router = require('express').Router()
const userController = require('../controllers/users')
const authMW = require('../middlewares/jwt_auth_mw')

router.get('/searches', authMW.authenticateToken, userController.getSearchHistory)
router.get('/me', authMW.authenticateToken, userController.getSelf)
router.post('/', userController.create)

module.exports = router