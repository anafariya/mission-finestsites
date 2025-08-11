const city = require('../model/city');
const utility = require('../helper/utility');
const mongoose = require('mongoose');

/*
* city.get()
* get all the citys registered on your app
*/

exports.get = async function (req, res) {
  try {
    const { search = '', group } = req.query;
    const cities = await city.get({ search, group });
    return res.status(200).send({ data: cities });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

/*
* city.update()
* update a city
*/

exports.update = async function(req, res){

  const data = req.body;
  const cityId = req.params.id || req.city;

  const cityData = await city.get({ id: new mongoose.Types.ObjectId(cityId) });
  utility.assert(cityData.length, `city doesn't exist`);

  await city.update({ id: new mongoose.Types.ObjectId(cityId), data: data });
  return res.status(200).send({ message: `${data.id || 'city'} updated` });

}

/*
* city.create()
* create a city
*/

exports.create = async function(req, res){

  const data = req.body;
  utility.validate(data, ['name']);

  await city.create(data);
  return res.status(200).send({ message: `${data.name || 'city'} added` });

}

/*
* city.delete()
* delete a city
*/

exports.delete = async function(req, res){

  const id  = req.params.id;
  utility.validate(id);

  await city.delete({ id: new mongoose.Types.ObjectId(id) });
  res.status(200).send({ message: `City deleted` });

}