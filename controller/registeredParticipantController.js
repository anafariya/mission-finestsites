const account = require('../model/account');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const user = require('../model/user');
const registeredParticipant = require('../model/registered-participant');

/*
 * registeredParticipant.getByEventId()
 */
exports.getByEventId = async function (req, res) {
  const id = req.params.id;
  utility.assert(id , 'No Id provided');
  try {
    const data = await registeredParticipant.getRegistered({ event_id:  new mongoose.Types.ObjectId(id) });

    return res.status(200).send({ data: data });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};