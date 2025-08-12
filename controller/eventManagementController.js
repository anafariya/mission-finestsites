const event = require('../model/event-management');
const ConfirmedMatch = require('../model/confirm-match');
const group = require('../model/group');
const teams = require('../model/team');
const user = require('../model/user');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const mail = require('../helper/mail');
const registeredParticipant = require('../model/registered-participant');

/*
 * event.get()
 */
exports.get = async function (req, res) {
  try {
    const { search = '', city = '', status = '', barId = '' } = req.query;
    const query = {};

    if (city) query.city = city;
    if (status) query.status = status;
    if (barId) query['bars._id'] = barId;

    if (search) {
      
    }

    const events = await event.get(query);
    return res.status(200).send({ data: events });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

/*
 * event.create()
 */
exports.create = async function (req, res) {
  const data = req.body;

  // Required field validation
  utility.assert(data, ['date', 'city', 'bars', 'start_time', 'end_time', 'tagline'], 'Please check your required inputs again');

  try {
    const { image } = data;

    if (image) {
      const ext = path.extname(image).slice(1);
      const newImageName = `event-${Date.now()}.${ext}`;

      const previewSignedUrl = await s3.signedURL({
        filename: `${newImageName}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      data.image = newImageName;
      
      await event.create(data);

      return res.status(200).send({
        files_to_upload: [{ name: image, url: previewSignedUrl }],
        message: 'Uploading the event image, please do not close this window yet.'
      });
    } else {
      data.bars = data.bars.map((dt) => {
        return {
          _id: new mongoose.Types.ObjectId(dt.name),
          available_spots: dt.available_spots
        }
      })
      data.is_draft = data.is_draft || false
      await event.create(data);
      return res.status(200).send({ message: `Event created successfully` });
    }

  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.update()
 */
exports.update = async function (req, res) {
  const id = req.params.id;
  const data = req.body;

  try {
    utility.validate(id);
    const existing = await event.getById({ id: new mongoose.Types.ObjectId(id) });
    utility.assert(existing, 'Event not found');
    data.bars = data.bars.map((dt) => {
      return {
        _id: new mongoose.Types.ObjectId(dt.name),
        available_spots: dt.available_spots
      }
    })
    const image = data.image
    if(data.changeImage){
      const ext = path.extname(image).slice(1);
      const newPreviewImage = `event-${Date.now()}.${ext}` 
      
      const previewSignedUrl = await s3.signedURL({
        filename: `${newPreviewImage}`,
        acl: 'bucket-owner-full-control',
        contentType: `image/${ext}`,
      });
      data.image = newPreviewImage;
    
      await event.update({ id: new mongoose.Types.ObjectId(id), data });
    
      return res.status(200).send({ 

        files_to_upload: [
        { name: image, url: previewSignedUrl }
        ],
        message: 'Uploading the project files, please dont close this window yet.' 
      });
    } else {
      delete data.image
    }
    data.is_draft = data.is_draft || false
    await event.update({ id: new mongoose.Types.ObjectId(id), data });
    if(data.subject_email && data.body_email){
      const participants = await registeredParticipant.getRegistered({ event_id:  new mongoose.Types.ObjectId(id), isValid: true });
      if(participants.length){
    
        for (const participant of participants){
          const participantData = participant;
          if(participantData) {
            const email = participantData.email
            const rex = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|'(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*')@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
            if (rex.test(email.toLowerCase())){
    
              await mail.send({
              
                to: email,
                locale: 'de',
                template: 'template',
                subject: data.subject_email,
                content: { 
                  body: `Hallo ${participantData.first_name},\n\n${data.body_email}`,
                  closing: 'Beste grüße,',
                  button: {
                    url: process.env.CLIENT_URL,
                    label: 'Zum Meetlocal-Dashboard'
                  }
                }
              })
    
            }
          }
        }
      }
    }
    return res.status(200).send({ message: `Event updated` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.delete()
 */
exports.delete = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    await event.delete({ id: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ message: `Event deleted` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.getById()
 */
exports.getById = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const eventData = await event.getById({ id: new mongoose.Types.ObjectId(id) });
    if(eventData.image){
      const ext = await path.extname(eventData.image).slice(1);
      const previewSignedUrl = await s3.signedURLView({
        filename: `${eventData.image}`,
        acl: 'bucket-owner-full-control',
        // 'public-read',
        contentType: `image/${ext}`,
      });
      eventData.image = previewSignedUrl;
    }
    return res.status(200).send({ data: eventData });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.getLocations()
 */
exports.getLocations = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const eventData = await event.getLocations({ id: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ data: eventData });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.cancel()
 */
exports.cancel = async function (req, res) {
  const id = req.params.id;
  const isCanceled = req.body.isCanceled || false;
  try {
    utility.validate(id);
    await event.cancel({ id: new mongoose.Types.ObjectId(id), isCanceled });
    return res.status(200).send({ message: `Event canceled` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.getTeamsByEventId()
 */
exports.getTeamsByEventId = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const teamData = await teams.get({ eventId: new mongoose.Types.ObjectId(id) });
    
    const data = teamData?.map((team, i) => {
      return {
        ...team.toObject(),
        _id: team._id,
        no: i + 1,
        first_member_name: team.members?.[0]?.first_name ? `${team.members?.[0]?.first_name} ${team.members?.[0]?.last_name}` : team.members?.[0]?.name,
        team_members: team.members?.map(team => team.first_name ? `${team.first_name} ${team.last_name}` : team.name),
        assignment_method: team.method,
      }
    })
    return res.status(200).send({ data: data });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.getTeam()
 */
exports.getTeam = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const teamData = await teams.getById({ id });
    const team = teamData?.[0]?.toObject();
    const data = team && {
        ...team,
        _id: team._id,
        first_member_name: team.members?.[0]?.first_name ? `${team.members?.[0]?.first_name} ${team.members?.[0]?.last_name}` : team.members?.[0]?.name,
        team_members: team.members?.map(team => team.first_name ? `${team.first_name} ${team.last_name}` : team.name),
        assignment_method: team.method,
      }
    return res.status(200).send({ data: data });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * event.getEventChats()
 */
exports.getEventChats = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const matches = await ConfirmedMatch.getEventChats({eventId})

    const result = matches.map(m => ({
      user_1: !m.user_1?.first_name ? m.user_1?.name : `${m.user_1?.first_name} ${m.user_1?.last_name}`,
      user_2: !m.user_2?.first_name ? m.user_2?.name : `${m.user_2?.first_name} ${m.user_2?.last_name}`,
      last_message_by: m.last_message_by ? 
        (m.user_1?._id.toString() === m.last_message_by ? !m.user_1?.first_name ? m.user_1?.name : `${m.user_1?.first_name} ${m.user_1?.last_name}`
        : !m.user_2?.first_name ? m.user_2?.name : `${m.user_2?.first_name} ${m.user_2?.last_name}`) : '-',
      last_message_time: m.last_message_time || null,
      status: m.status,
      _id: m._id
    }));

    return res.status(200).send({ data: result });
  } catch (err) {
    console.error('Failed to get event chats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/*
 * event.archiveChat()
 */
exports.archiveChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const isArchive = req.body.isArchive || false;

    const chat = await ConfirmedMatch.archiveChat({chatId: new mongoose.Types.ObjectId(chatId), isArchive})

    return res.status(200).send({ data: true });
  } catch (err) {
    console.error('Failed to get event chats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};