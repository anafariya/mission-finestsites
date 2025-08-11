const auth = require('../model/auth');
const user = require('../model/user');
const utility = require('../helper/utility');
const s3 = require('../helper/s3');
const path = require('path');
const mongoose = require('mongoose');

/*
* user.get()
* get all the users registered on your app
*/

exports.get = async function(req, res){

  let users = await user.get();
  
  users = await Promise.all(users?.map(async (dt) => {
    if(dt.avatar){
      const ext = await path.extname(dt.avatar).slice(1);
      const previewSignedUrl = await s3.signedURLView({
        filename: `${dt.avatar}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      dt.avatar = previewSignedUrl;
    }
    return {
      name: dt.first_name ? `${dt.first_name} ${dt.last_name}` : dt.name,
      email: dt.email,
      date_created: dt.date_created,
      last_active: dt.last_active,
      onboarded: dt.onboarded || false,
      avatar: dt.avatar || null,
      _id: dt._id,
      id: dt.id
    }
  }))
  return res.status(200).send({ data: users });

}

/*
 * user.getById()
 */
exports.getById = async function (req, res) {
  const id = req.params.id;
  utility.assert(id , 'No Id provided');
  try {
    let userData = await user.getById({ id: new mongoose.Types.ObjectId(id) });
    let signedImgs;
    if(userData.images?.length){
      signedImgs = await Promise.all(userData.images.map(async(img) => {
        const ext = await path.extname(img).slice(1);
        const previewSignedUrl = await s3.signedURLView({
          filename: `${img}`,
          acl: 'bucket-owner-full-control',
          // 'public-read',
          contentType: `image/${ext}`,
        });
        return previewSignedUrl;
      }))
    }
    return res.status(200).send({ data: {
      ...userData.toObject(),
      age: utility.getAgeFromDate(userData?.date_of_birth),
      images: signedImgs
    } });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
* user.update()
* update a user profile
*/

exports.update = async function(req, res){

  const data = req.body;
  const userId = req.params.id || req.user;

  const userData = await user.get({ id: userId });
  utility.assert(userData.length, `User doesn't exist`);

  // if changing email - check if it's already used
  if (data.email && data.email !== userData[0].email){

    const exists = await user.get({ email: data.email });
    if (exists.length) throw { message: 'This email address is already registered' };

  }

  await user.update({ id: userId, data: data });
  return res.status(200).send({ message: `${data.email || 'User'} updated` });

}


/*
* user.impersonate()
* generate a token for impersonating a user on the remote app
*/

exports.impersonate = async function(req, res){

  // check user exists
  const userData = await user.get({ id: req.params.id });
  utility.assert(userData.length, 'User does not exist');
  
  // is impersonation enabled?
  utility.assert(userData[0].support_enabled, 'User has disabled impersonation');

  // generate a token that expires in 1 min
  const token = auth.token({ data: { user_id: userData[0].id, permission: 'master' }, duration: 60 });
  return res.status(200).send({ data: { token: token }});

}