'use strict';

const router = require('express').Router()

/* Import all routers */
const authRouter = require('./auth')
const usersRouter = require('./users')
const searchRouter = require('./search')

/* Bind all routes */
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/search', searchRouter)

module.exports = router