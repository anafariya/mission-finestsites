const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const City = require('./city').schema;

// Define schema
const LocationSchema = new Schema({
  name: { type: String, required: true },
  city: { type: Schema.Types.ObjectId, ref: 'City', required: true },
  address: { type: String, required: true },
  directions: { type: String, default: '' },
  image: { type: String, default: '' },
  contact_person: { type: String, required: true },
  contact_details: { type: String, required: true },
  internal_notes: { type: String, default: '' },
}, { timestamps: true });

const Location = mongoose.model('Location', LocationSchema, 'location');
exports.schema = Location;

/*
* location.create()
*/
exports.create = async function (location) {
  const data = new Location({
    name: location.name,
    city: location.city,
    address: location.address,
    directions: location.directions || '',
    image: location.image || '',
    contact_person: location.contact_person,
    contact_details: location.contact_details,
    internal_notes: location.internal_notes || '',
  });

  await data.save();
  return data;
};

/*
* location.get()
*/
exports.get = async function ({ search = '', city = '' }) {
  const query = {};

  if (city) {
    query.city = city;
  }

  if (search) {
    // Search for locations with matching name or city name
    const cityMatches = await City.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');

    const matchedCityIds = cityMatches.map(c => c._id);

    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $in: matchedCityIds } }
    ];
  }

  return await Location
    .find(query)
    .populate('city', 'name')
    .sort({ updatedAt: -1 });
};

/*
* location.get()
*/
exports.getById = async function ({ id }) {

  return await Location
    .findOne({ _id: id })
    .populate('city', 'name');
};

/*
* location.getByCityId()
*/
exports.getByCityId = async function ({ cityId }) {

  return await Location
    .find({ city: cityId })
    .populate('city', 'name')
    .select('_id name address')
    .sort({ name: 1 });
};

/*
* location.update()
*/
exports.update = async function ({ id, data }) {
  await Location.findOneAndUpdate({ _id: id }, data, { new: true });
  return data;
};

/*
* location.delete()
*/
exports.delete = async function ({ id }) {
  if (!id) throw { message: 'Please provide a location ID' };
  await Location.deleteOne({ _id: id });
  return id;
};
