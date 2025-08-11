const group = require('../model/group');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const user = require('../model/user');
const team = require('../model/team');

/*
 * group.create()
 */
exports.create = async function (req, res) {
  const data = req.body;

  console.log('[GROUP CREATE] 🚀 Starting group creation');
  console.log('[GROUP CREATE] 📄 Request body:', data);

  // Field-level validation with custom error messages
  utility.assert(data, ['event_id', 'group_members'] , 'Please check your required inputs again');
  
  try {
    console.log('[GROUP CREATE] 🔍 Fetching team data for first team member');
    const teamData = await team.getById({ id: new mongoose.Types.ObjectId(data.group_members[0]) });
    console.log('[GROUP CREATE] ✅ Team data received:', teamData);
    
    if (!teamData || teamData.length === 0) {
      console.log('[GROUP CREATE] ❌ No team data found for team ID:', data.group_members[0]);
      return res.status(400).send({ error: 'Team not found' });
    }
    
    const ageGroup = teamData[0]?.age_group;
    console.log('[GROUP CREATE] 🎯 Age group extracted:', ageGroup);
    
    if (!ageGroup) {
      console.log('[GROUP CREATE] ❌ No age group found in team data');
      return res.status(400).send({ error: 'Team age group not found' });
    }
    
    console.log('[GROUP CREATE] 🔄 Calling group.add with data:', {
      team_ids: data.group_members,
      age_group: ageGroup,
      method: 'assigned by Admin',
      slot: Number(data.slot),
      bar_id: data.bar_id,
      group_name: data.group_name
    });
    
    await group.add({
      group: {
        team_ids: data.group_members.map(dt => {
          return {
            id: dt
          }
        }),
        age_group: ageGroup,
        method: 'assigned by Admin',
        slot: Number(data.slot),
        bar_id: data.bar_id,
        group_name: data.group_name
      },
      eventId: data.event_id,
    });
    
    console.log('[GROUP CREATE] ✅ Group created successfully');
  
    return res.status(200).send({ 
        message: 'Success add the group' 
      })
  } catch (err) {
    console.error('[GROUP CREATE] ❌ Error creating group:', err);
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
    
    await group.update({
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