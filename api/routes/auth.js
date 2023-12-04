'use strict';

const router = require('express').Router()
const authController = require('../controllers/auth')

router.get('/login', authController.login)
router.get('/refreshToken', authController.refreshToken)

module.exports = router