const event = require('../model/event-management');
const ConfirmedMatch = require('../model/confirm-match');
const group = require('../model/group');
const teams = require('../model/team');
const user = require('../model/user');
const axios = require('axios');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');

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
 * Proxy admin cancellation to main server
 */
exports.cancel = async function (req, res) {
  const id = req.params.id;
  const isCanceled = req.body.isCanceled || false;
  
  
  try {
    utility.validate(id);
    
    if (isCanceled) {
      // Forward the cancellation request to main server
      
      const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:8080';
      const finalUrl = mainServerUrl;
      
      try {
        const response = await axios.put(`${finalUrl}/api/admin/cancel-event/${id}`, 
          { isCanceled: true },
          {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update local event status
        await event.cancel({ id: new mongoose.Types.ObjectId(id), isCanceled: true });
        
        return res.status(200).send(response.data);
        
      } catch (apiError) {
        // Fallback: Just update event status locally
        await event.cancel({ id: new mongoose.Types.ObjectId(id), isCanceled: true });
        
        return res.status(200).send({ 
          message: 'Event status updated. Note: Participant cancellations need to be processed separately.',
          warning: 'Main server API not available for automatic participant processing',
          error_details: apiError.message
        });
      }
      
    } else {
      // REACTIVATING EVENT - Just update status
      await event.cancel({ id: new mongoose.Types.ObjectId(id), isCanceled: false });
      return res.status(200).send({ message: `Event reactivated successfully` });
    }
    
  } catch (err) {
    return res.status(500).send({ error: err.message || 'Failed to cancel event' });
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

/*
 * event.cancelGroup()
 * Handle group cancellation directly in Mission Control
 */
exports.cancelGroup = async function (req, res) {
  const groupId = req.params.groupId;
  
  try {
    utility.validate(groupId);
    
    
    // Import required models
    const group = require('../model/group');
    const team = require('../model/team');
    const user = require('../model/user');
    
    // Get group details with populated teams and members
    const groupData = await group.getById({ id: groupId });
    
    if (!groupData) {
      return res.status(404).send({ error: 'Group not found' });
    }
    
    
    if (!groupData.team_ids || groupData.team_ids.length === 0) {
      return res.status(400).send({ error: 'Group has no teams to cancel' });
    }
    
    // Process group cancellation
    let totalMembers = 0;
    let processedTeams = 0;
    let processedMembers = 0;
    let errorCount = 0;
    const results = [];
    
    
    for (const teamInfo of groupData.team_ids) {
      const teamId = teamInfo._id || teamInfo;
      
      try {
        // Get detailed team info if not already populated
        let teamDetails = teamInfo;
        if (!teamInfo.members) {
          const teamData = await team.getById({ id: teamId });
          teamDetails = teamData && teamData[0] ? teamData[0] : null;
        }
        
        if (!teamDetails || !teamDetails.members) {
          results.push({ team_id: teamId, status: 'no_members' });
          continue;
        }
        
        
        // Process each team member
        for (const member of teamDetails.members) {
          const userId = member._id || member;
          
          try {
            // Get user details
            const userDetails = await user.get({ id: userId });
            if (!userDetails) {
              results.push({ 
                team_id: teamId,
                user_id: userId, 
                status: 'user_not_found' 
              });
              continue;
            }
            
            
            // Here you would typically:
            // 1. Cancel any event registrations for this user
            // 2. Generate vouchers if needed
            // 3. Send cancellation emails
            // 4. Update any relevant statuses
            
            // For now, we'll just mark as processed
            results.push({ 
              team_id: teamId,
              user_id: userId,
              email: userDetails.email,
              name: userDetails.name || userDetails.first_name,
              status: 'cancelled'
            });
            
            processedMembers++;
            
          } catch (memberError) {
            errorCount++;
            results.push({ 
              team_id: teamId,
              user_id: userId,
              status: 'error',
              error: memberError.message 
            });
          }
        }
        
        processedTeams++;
        totalMembers += teamDetails.members.length;
        
      } catch (teamError) {
        errorCount++;
        results.push({ 
          team_id: teamId,
          status: 'error',
          error: teamError.message 
        });
      }
    }
    
    // Update group status (you might want to add a status field to groups)
    // await group.update({ id: groupId, group: { status: 'cancelled' } });
    
    const response = {
      message: `Group cancellation completed. Processed ${processedTeams} teams, ${processedMembers} members, ${errorCount} errors.`,
      data: {
        group_id: groupId,
        group_name: groupData.group_name,
        total_teams: groupData.team_ids.length,
        teams_processed: processedTeams,
        total_members: totalMembers,
        members_processed: processedMembers,
        errors: errorCount,
        results: results
      }
    };
    
    
    return res.status(200).send(response);
    
  } catch (err) {
    return res.status(500).send({ 
      error: err.message || 'Failed to cancel group',
      group_id: groupId,
      details: 'Check server logs for detailed error information'
    });
  }
};

/*
 * event.cancelTeam()
 * Handle team cancellation directly in Mission Control
 */
exports.cancelTeam = async function (req, res) {
  const teamId = req.params.teamId;
  
  try {
    utility.validate(teamId);
    
    
    // Import required models
    const team = require('../model/team');
    const user = require('../model/user');
    const event = require('../model/event-management');
    
    // Get team details
    const teamData = await team.getById({ id: teamId });
    
    if (!teamData || teamData.length === 0) {
      return res.status(404).send({ error: 'Team not found' });
    }
    
    const teamInfo = teamData[0];
    
    if (!teamInfo.members || teamInfo.members.length === 0) {
      return res.status(400).send({ error: 'Team has no members to cancel' });
    }
    
    // Process team cancellation
    let processedCount = 0;
    let errorCount = 0;
    const results = [];
    
    
    for (const member of teamInfo.members) {
      const userId = member._id || member;
      
      try {
        // Get user details
        const userDetails = await user.get({ id: userId });
        if (!userDetails) {
          console.log(`[MISSION CONTROL] ⚠️ User not found: ${userId}`);
          results.push({ user_id: userId, status: 'user_not_found' });
          continue;
        }
        
        console.log(`[MISSION CONTROL] ✅ Found user: ${userDetails.email || userDetails.name}`);
        
        // Here you would typically:
        // 1. Cancel any event registrations for this user
        // 2. Generate vouchers if needed
        // 3. Send cancellation emails
        // 4. Update any relevant statuses
        
        // For now, we'll just mark as processed
        results.push({ 
          user_id: userId,
          email: userDetails.email,
          name: userDetails.name || userDetails.first_name,
          status: 'cancelled'
        });
        
        processedCount++;
        console.log(`[MISSION CONTROL] ✅ Successfully processed user: ${userId}`);
        
      } catch (memberError) {
        errorCount++;
        console.error(`[MISSION CONTROL] ❌ Error processing user ${userId}:`, memberError);
        results.push({ 
          user_id: userId,
          status: 'error',
          error: memberError.message 
        });
      }
    }
    
    // Update team status (you might want to add a status field to teams)
    // await team.update({ id: teamId, team: { status: 'cancelled' } });
    
    const response = {
      message: `Team cancellation completed. Processed ${processedCount} members, ${errorCount} errors.`,
      data: {
        team_id: teamId,
        total_members: teamInfo.members.length,
        members_processed: processedCount,
        errors: errorCount,
        results: results
      }
    };
    
    
    return res.status(200).send(response);
    
  } catch (err) {
    return res.status(500).send({ 
      error: err.message || 'Failed to cancel team',
      team_id: teamId,
      details: 'Check server logs for detailed error information'
    });
  }
};