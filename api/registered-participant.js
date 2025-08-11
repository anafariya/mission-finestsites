const express = require('express');
const auth = require('../model/auth');
const registeredParticipantController = require('../controller/registeredParticipantController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/registered-participant/event/:id', auth.verify('master'), use(registeredParticipantController.getByEventId));


module.exports = api;
