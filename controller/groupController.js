const group = require('../model/group');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const user = require('../model/user');
const team = require('../model/team');
const mail = require('../helper/mail');

/*
 * group.create()
 */
exports.create = async function (req, res) {
  const data = req.body;

  // Field-level validation with custom error messages
  utility.assert(data, ['event_id', 'group_members'] , 'Please check your required inputs again');
  try {
    const teamData = await team.getById({ id: new mongoose.Types.ObjectId(data.group_members[0]) });
    console.log(teamData, 'teamdata');
    
    await group.add({
      group: {
        team_ids: data.group_members.map(dt => {
          return {
            id: dt
          }
        }),
        age_group: teamData?.[0]?.age_group,
        method: 'assigned by Admin',
        slot: Number(data.slot),
        bar_id: data.bar_id,
        group_name: data.group_name
      },
      eventId: data.event_id,
    });
  
    return res.status(200).send({ 
        message: 'Success add the group' 
      })
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * group.update()
 */
exports.update = async function (req, res) {
  const id = req.params.id || req.group;
  const data = req.body;

  try {
    const existing = await group.getById({ id: id });
    utility.assert(!existing.length, 'group not found');

    utility.assert(data, ['event_id', 'group_members'] , 'Please check your required inputs again');
    const teamData = await team.get({ _id: new mongoose.Types.ObjectId(data.group_members[0]) });
    
    const groupData = await group.update({
      id,
      group: {
        team_ids: data.group_members.map(dt => {
          return {
            id: dt
          }
        }),
        age_group: teamData?.[0]?.age_group,
        method: 'assigned by Admin',
        slot: Number(data.slot),
        bar_id: data.bar_id,
        group_name: data.group_name
      },
      eventId: data.event_id
    });

    if(data.subject_email && data.body_email){
      if (groupData){
        let teamDatas = groupData.team_ids
        for(const teamData of teamDatas){
          let participantDatas = teamData.members;
          for(const participantData of participantDatas){
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
    }
  
    return res.status(200).send({ 
      message: 'Success update the group' 
    })
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * group.delete()
 */
exports.delete = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    await group.delete({ id: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ message: `group deleted` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * group.getGroupsByEventId()
 */
exports.getGroupsByEventId = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const groupData = await group.get({ eventId: new mongoose.Types.ObjectId(id) });
    
    const data = groupData?.map((dt, i) => {
      return {
        id: dt._id,
        group_name: dt.group_name,
        participants: dt.total_members,
        total_teams: dt.team_ids?.length || 0,
        status: dt.status || 'Active',
        assignment_method: dt.method || 'assigned by AI',
      }
    })
    return res.status(200).send({ data: data });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * group.getById()
 */
exports.getById = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const data = await group.getById({ id: new mongoose.Types.ObjectId(id) });
    
    return res.status(200).send({ data: data });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};