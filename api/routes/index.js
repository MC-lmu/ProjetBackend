'use strict';

const router = require('express').Router()

/* Import and bind all routes */
const authRouter = require('./auth')
const usersRouter = require('./users')

router.use('/auth', authRouter)
router.use('/users', usersRouter)

module.exports = router