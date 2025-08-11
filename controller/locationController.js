const location = require('../model/location');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');

/*
 * location.get()
 */
exports.get = async function (req, res) {
  try {
    const { search = '', city = '' } = req.query;
    const locations = await location.get({ search, city });
    return res.status(200).send({ data: locations });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

/*
 * location.getByCityId()
 */
exports.getByCityId = async function (req, res) {
  try {
    const id = req.params.id
    const locations = await location.getByCityId({ cityId: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ data: locations });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

/*
 * location.create()
 */
exports.create = async function (req, res) {
  const data = req.body;

  // Field-level validation with custom error messages
  utility.assert(data, ['name', 'city', 'address', 'contact_person', 'contact_details'] , 'Please check your required inputs again');
  try {
    const { image } = data;

    // rename preview image to always be preview.ext
    if(image?.length){
      const ext = path.extname(image).slice(1);
      const newPreviewImage = `location-${Date.now()}.${ext}` 
      // Optionally validate file type and count if you handle file uploads separately
      const previewSignedUrl = await s3.signedURL({
        filename: `${newPreviewImage}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      data.image = newPreviewImage;
      await location.create(data);
  
      return res.status(200).send({ 
          
          files_to_upload: [
          { name: image, url: previewSignedUrl }
          ],
          message: 'Uploading the project files, please dont close this window yet.' 
      
      });
    }
    await location.create(data);
  
    return res.status(200).send({ 
        message: 'Success add the location' 
      })
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * location.update()
 */
exports.update = async function (req, res) {
  const id = req.params.id || req.location;
  const data = req.body;

  try {
    const existing = await location.get({ id: new mongoose.Types.ObjectId(id) });
    utility.assert(existing.length, 'Location not found');

    utility.assert(data, ['name', 'city', 'address', 'contact_person', 'contact_details'] , 'Please check your required inputs again');

    const image = data.image
    if(data.changeImage){
      const ext = path.extname(image).slice(1);
      const newPreviewImage = `location-${Date.now()}.${ext}` 
      // Optionally validate file type and count if you handle file uploads separately
      const previewSignedUrl = await s3.signedURL({
        filename: `${newPreviewImage}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      data.image = newPreviewImage;

      await location.update({ id: new mongoose.Types.ObjectId(id), data });

      return res.status(200).send({ 
        
        files_to_upload: [
        { name: image, url: previewSignedUrl }
        ],
        message: 'Uploading the project files, please dont close this window yet.' 
      });
    } else {
      delete data.image
    }

    await location.update({ id: new mongoose.Types.ObjectId(id), data });
    return res.status(200).send({ message: `${data.name} updated` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * location.delete()
 */
exports.delete = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    await location.delete({ id: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ message: `Location deleted` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * location.getById()
 */
exports.getById = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const locationData = await location.getById({ id: new mongoose.Types.ObjectId(id) });
    if(locationData){
      const ext = await path.extname(locationData.image).slice(1);
      const previewSignedUrl = await s3.signedURLView({
        filename: `${locationData.image}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      locationData.image = previewSignedUrl;
    }
    return res.status(200).send({ data: locationData });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};