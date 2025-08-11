const express = require('express');
const auth = require('../model/auth');
const cityController = require('../controller/cityController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/city', auth.verify('master'), use(cityController.get));

api.delete('/api/city/:id', auth.verify('master'), use(cityController.delete));

api.post('/api/city', auth.verify('master'), use(cityController.create));

api.patch('/api/city/:id', auth.verify('master'), use(cityController.update));


module.exports = api;
