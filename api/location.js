const express = require('express');
const auth = require('../model/auth');
const locationController = require('../controller/locationController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/location', auth.verify('master'), use(locationController.get));

api.get('/api/location/:id', auth.verify('master'), use(locationController.getById));

api.get('/api/location/city/:id', auth.verify('master'), use(locationController.getByCityId));

api.delete('/api/location/:id', auth.verify('master'), use(locationController.delete));

api.post('/api/location', auth.verify('master'), use(locationController.create));

api.patch('/api/location/:id', auth.verify('master'), use(locationController.update));

module.exports = api;
