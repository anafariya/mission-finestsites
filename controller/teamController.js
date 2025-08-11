const team = require('../model/team');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const user = require('../model/user');

/*
 * team.create()
 */
exports.create = async function (req, res) {
  const data = req.body;

  // Field-level validation with custom error messages
  utility.assert(data, ['event_id', 'team_members'] , 'Please check your required inputs again');
  try {
    const userData = await user.get({ _id: new mongoose.Types.ObjectId(data.team_members[0]) });
    
    await team.add({
      team: {
        members: data.team_members.map(dt => {
          return {
            id: dt
          }
        }),
        age_group: userData?.[0]?.date_of_birth && utility.getAgeGroup(utility.getAgeFromDate(userData?.[0]?.date_of_birth)),
        method: 'assigned by Admin'
      },
      eventId: data.event_id
    });
  
    return res.status(200).send({ 
        message: 'Success add the team' 
      })
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * team.update()
 */
exports.update = async function (req, res) {
  const id = req.params.id || req.team;
  const data = req.body;

  try {
    const existing = await team.getById({ id: id });
    utility.assert(existing.length, 'team not found');

    utility.assert(data, ['event_id', 'team_members'] , 'Please check your required inputs again');
    const userData = await user.get({ _id: new mongoose.Types.ObjectId(data.team_members[0]) });
    
    await team.update({
      id,
      team: {
        members: data.team_members.map(dt => {
          return {
            id: dt
          }
        }),
        age_group: userData?.[0]?.date_of_birth && utility.getAgeGroup(utility.getAgeFromDate(userData[0].date_of_birth))
      },
      eventId: data.event_id
    });
    if(data.subject_email && data.body_email){
      for (const participant of data.team_members){
        let participantData = await user.get({ _id: new mongoose.Types.ObjectId(participant) });

        if(participantData) {
          participantData = participantData[0]
          const email = participantData.email
          const rex = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|'(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*')@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
          if (rex.test(email.toLowerCase())){

            await mail.send({

              to: email,
              locale: 'de',
              template: 'template',
              subject: data.subject_email,
              content: { 
                body: `Hallo ${participantData.first_name || participantData.name},\n\n${data.body_email}`,
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
    return res.status(200).send({ 
      message: 'Success update the team' 
    })
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * team.delete()
 */
exports.delete = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    await team.delete({ id: new mongoose.Types.ObjectId(id) });
    return res.status(200).send({ message: `team deleted` });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
};

/*
 * team.getteamsByEventId()
 */
exports.getTeamsByEventId = async function (req, res) {
  const id = req.params.id;

  try {
    utility.validate(id);
    const teamData = await team.get({ eventId: new mongoose.Types.ObjectId(id) });
    
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
