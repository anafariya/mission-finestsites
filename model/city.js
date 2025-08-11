const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define schema
const CitySchema = new Schema({
  name: { type: String, unique: true, required: true }

}, { timestamps: true });

const City = mongoose.model('City', CitySchema, 'city');
exports.schema = City;

/*
* city.create()
* create a new city 
*/

exports.create = async function(city){

  const data = new City({
    name: city.name || 'My city'

  });

  const newCity = City(data);
  await newCity.save();
  return data;

}

/*
* city.get()
* get an city by email or id
*/

exports.get = async function ({ search = '', group = '' }) {
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  let cities = await City.find(query).sort({ updatedAt: -1 });

  return cities;
};


/*
* city.delete()
* delete an city by id
*/

exports.delete = async function({ id }){

  if (!id)
    throw { message: 'Please provide an city ID' };

  await City.deleteOne({ 
    
    _id: id,
  
  });

  return id;

}

/*
* city.update()
* update an city by id
*/

exports.update = async function({ id, data }){

  await City.findOneAndUpdate({ _id: id }, data);
  return data;

}