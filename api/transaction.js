const express = require('express');
const auth = require('../model/auth');
const transactionController = require('../controller/transactionController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/transaction/event/:id', auth.verify('master'), use(transactionController.getByEventId));
api.get('/api/transaction/:id', auth.verify('master'), use(transactionController.getById));


module.exports = api;
