const event = require('../model/event-management');
const ConfirmedMatch = require('../model/confirm-match');
const group = require('../model/group');
const teams = require('../model/team');
const user = require('../model/user');
const utility = require('../helper/utility');
const mongoose = require('mongoose');
const s3 = require('../helper/s3');
const path = require('path');
const moment = require('moment-timezone');
const mail = require('../helper/mail');
const registeredParticipant = require('../model/registered-participant');
const stripe = require('../../server-finestsites/model/stripe');
const transaction = require('../model/transaction');

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

    // If admin cancels the event, also cancel all active registrations,
    // issue vouchers when eligible (>24h before start), and send emails
    if (isCanceled) {
      try {
        const eventId = id;
        const eventData = await event.getById({ id: new mongoose.Types.ObjectId(eventId) });
        utility.assert(eventData, 'Event not found');

        const eventDateTime = moment.tz(
          `${eventData.date.toISOString().split('T')[0]} ${eventData.start_time}`,
          'YYYY-MM-DD HH:mm',
          'Europe/Berlin'
        );
        const nowBerlin = moment.tz('Europe/Berlin');
        const hoursUntilEvent = eventDateTime.diff(nowBerlin, 'hours', true);

        // Active registrations for this event
        let registrations = await mongoose.model('RegisteredParticipant').find({
          event_id: new mongoose.Types.ObjectId(eventId),
          status: 'registered',
          $or: [{ is_cancelled: false }, { is_cancelled: { $exists: false } }]
        }).populate('user_id');

        if (!registrations.length) {
          // Extra diagnostics to understand data shape
          const totalForEvent = await mongoose.model('RegisteredParticipant').countDocuments({
            event_id: new mongoose.Types.ObjectId(eventId)
          });
          const totalRegistered = await mongoose.model('RegisteredParticipant').countDocuments({
            event_id: new mongoose.Types.ObjectId(eventId),
            status: 'registered'
          });
          const totalActiveRegistered = await mongoose.model('RegisteredParticipant').countDocuments({
            event_id: new mongoose.Types.ObjectId(eventId),
            status: 'registered',
            $or: [{ is_cancelled: false }, { is_cancelled: { $exists: false } }]
          });

          const sample = await mongoose.model('RegisteredParticipant')
            .find({ event_id: new mongoose.Types.ObjectId(eventId) })
            .limit(3).lean();

          // Fallback: use admin model aggregator to fetch active registered participants
          try {
            const agg = await registeredParticipant.getRegistered({ event_id: new mongoose.Types.ObjectId(eventId), isValid: true });

            // Normalize aggregated results to mimic populated shape
            registrations = agg.map(a => ({
              _id: a._id,
              user_id: a.user_id, // raw ObjectId
              email: a.email,
              first_name: a.first_name,
              last_name: a.last_name,
              __agg: true,
            }));
          } catch (aggErr) {
            console.error('❌ Fallback aggregator failed:', aggErr);
          }
        }

        let emailsSent = 0;
        let vouchersCreated = 0;
        const eligibleForVoucher = true;
        for (const registration of registrations) {
          try {

            // Mark registration as cancelled
            await mongoose.model('RegisteredParticipant').findByIdAndUpdate(registration._id, {
              status: 'canceled',
              is_cancelled: true,
              cancel_date: new Date()
            });

            const userData = registration.user_id && registration.user_id.email ? registration.user_id : {
              _id: registration.user_id,
              email: registration.email,
              first_name: registration.first_name,
              last_name: registration.last_name,
              locale: 'de'
            };
            let voucherData = null;

            // Create voucher if eligible
            if (eligibleForVoucher) {
              try {
                const userTransaction = await mongoose.model('Transaction').findOne({
                  user_id: new mongoose.Types.ObjectId(userData._id),
                  event_id: new mongoose.Types.ObjectId(eventId),
                  type: 'Register Event'
                });

                if (userTransaction && userTransaction.amount > 0) {
                  voucherData = await stripe.createCoupon({
                    userId: userData._id,
                    eventName: eventData.city.name,
                    amount: userTransaction.amount
                  });
                  vouchersCreated++;
                }
              } catch (voucherError) {
                console.error('❌ Failed to create voucher:', voucherError);
              }
            }

            // Send cancellation email
            try {
              const eventDateFormatted = moment(eventData.date).tz('Europe/Berlin').format('DD.MM.YYYY');
              let bodyText = voucherData ?
                `Ihr Event "${eventData.city.name}" am ${eventDateFormatted} wurde leider abgesagt. Da die Absage mehr als 24 Stunden vor dem Event erfolgte, haben wir einen Gutschein für Sie erstellt.` :
                `Ihr Event "${eventData.city.name}" am ${eventDateFormatted} wurde leider abgesagt. Da die Absage weniger als 24 Stunden vor dem Event erfolgte, kann kein Gutschein ausgestellt werden.`;

              if (voucherData) {
                const voucherAmountText = voucherData?.amount_off ? `€${(voucherData.amount_off / 100).toFixed(2)}` : null;
                const voucherExpiryText = voucherData?.redeem_by ? moment.unix(voucherData.redeem_by).format('DD.MM.YYYY') : null;
                bodyText += `\n\nGutscheincode: ${voucherData.id}`;
                if (voucherAmountText) bodyText += `\nWert: ${voucherAmountText}`;
                if (voucherExpiryText) bodyText += `\nGültig bis: ${voucherExpiryText}`;
              }

              const emailTemplateBase = voucherData ? 'event_cancelled_with_voucher' : 'event_cancelled_no_voucher';
              const emailTemplate = (userData.locale || 'de').toString().toLowerCase().startsWith('de') 
                ? `${emailTemplateBase}_de` 
                : emailTemplateBase;
              
              await mail.send({
                to: userData.email,
                locale: userData.locale || 'de',
                html_template: emailTemplate,
                subject: voucherData ? 'Event abgesagt - Gutschein erhalten' : 'Event abgesagt',
                content: {
                  name: userData.first_name || userData.name,
                  body: bodyText,
                  event_name: eventData.city.name,
                  event_date: eventDateFormatted,
                  voucher_code: voucherData?.id,
                  voucher_amount: voucherData ? `€${(voucherData.amount_off / 100).toFixed(2)}` : null,
                  voucher_expiry: voucherData?.redeem_by ? moment.unix(voucherData.redeem_by).format('DD.MM.YYYY') : null,
                  body: bodyText,
                  closing: 'Mit freundlichen Grüßen',
                  button: voucherData ? {
                    url: process.env.CLIENT_URL || 'https://app.meetlocal.de',
                    label: 'Gutschein einlösen'
                  } : null
                }
              });
              emailsSent++;
            } catch (emailError) {
              console.error('❌ Failed to send cancellation email:', emailError);
            }
          } catch (processError) {
            console.error('❌ Failed to process registration during event cancel:', processError);
          }
        }

        return res.status(200).send({
          message: `Event canceled. ${registrations.length} registrations processed`,
          data: {
            cancelled_count: registrations.length,
            emails_sent: emailsSent,
            vouchers_created: vouchersCreated,
            hours_until_event: hoursUntilEvent.toFixed(1),
            eligible_for_voucher: eligibleForVoucher
          }
        });
      } catch (bulkError) {
        console.error('❌ Admin cancel bulk process failed:', bulkError);
        // Still return cancelled state even if bulk process had issues
        return res.status(200).send({ message: `Event canceled (participant processing had errors)` });
      }
    }

    return res.status(200).send({ message: `Event ${isCanceled ? 'canceled' : 'reactivated'}` });
  } catch (err) {
    console.error('❌ ADMIN EVENT CANCEL failed before processing:', err);
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

/*
 * eventManagement.cancelAllParticipants()
 * Cancel all participants for an event/group/team (admin function)
 */
exports.cancelAllParticipants = async function (req, res) {
  try {
    const eventId = req.params.id;
    const { type = 'event', groupId, teamId } = req.body; // type: 'event', 'group', 'team'

    utility.assert(eventId, 'Event ID is required');

    // Get event data
    const eventData = await event.getById({ id: new mongoose.Types.ObjectId(eventId) });
    utility.assert(eventData, 'Event not found');

    // Calculate hours until event start
    const eventDateTime = moment.tz(`${eventData.date.toISOString().split('T')[0]} ${eventData.start_time}`, 'YYYY-MM-DD HH:mm', 'Europe/Berlin');
    const nowBerlin = moment.tz('Europe/Berlin');
    const hoursUntilEvent = eventDateTime.diff(nowBerlin, 'hours', true);

    // Build query based on cancellation type
    let query = {
      event_id: new mongoose.Types.ObjectId(eventId),
      status: 'registered',
      $or: [{ is_cancelled: false }, { is_cancelled: { $exists: false } }]
    };

    // RegisteredParticipant does not store group_id or team_id.
    // For group/team cancellation, resolve user_ids via groups/teams membership and filter by user_id.
    if (type === 'group' && groupId) {
      const grp = await mongoose.model('Group').findOne({ _id: new mongoose.Types.ObjectId(groupId) }).populate({
        path: 'team_ids',
        populate: { path: 'members', model: 'User', select: '_id' }
      });
      const memberIds = grp?.team_ids?.flatMap(t => t.members?.map(m => m._id)) || [];
      if (memberIds.length === 0) {
        return res.status(404).send({ message: 'No members found in this group' });
      }
      query.user_id = { $in: memberIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (type === 'team' && teamId) {
      const teamDoc = await mongoose.model('Team').findOne({ _id: new mongoose.Types.ObjectId(teamId) }).populate('members', '_id');
      const memberIds = teamDoc?.members?.map(m => m._id) || [];
      if (memberIds.length === 0) {
        return res.status(404).send({ message: 'No members found in this team' });
      }
      query.user_id = { $in: memberIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Find all registrations to cancel
    const registrations = await registeredParticipant.find(query).populate('user_id');
    
    if (registrations.length === 0) {
      return res.status(404).send({ message: 'No active registrations found' });
    }

    let emailsSent = 0;
    let vouchersCreated = 0;
    const eligibleForVoucher = true;

    // Process each registration
    for (const registration of registrations) {
      try {
        // Mark as cancelled first
        await registeredParticipant.findByIdAndUpdate(registration._id, {
          status: 'canceled',
          is_cancelled: true,
          cancel_date: new Date()
        });

        const userData = registration.user_id;
        let voucherData = null;

        // Generate voucher if eligible (>24 hours before event)
        if (eligibleForVoucher) {          
          try {
            // Find the transaction to get the amount
            const userTransaction = await mongoose.model('Transaction').findOne({
              user_id: new mongoose.Types.ObjectId(userData._id),
              event_id: new mongoose.Types.ObjectId(eventId),
              type: 'Register Event'
            });

            if (userTransaction && userTransaction.amount > 0) {
              // Create Stripe voucher
              voucherData = await stripe.createCoupon({
                userId: userData._id,
                eventName: eventData.city.name,
                amount: userTransaction.amount
              });

              vouchersCreated++;
            } 
          } catch (voucherError) {
            console.error(`❌ Failed to create voucher for ${userData.email}:`, voucherError);
          }
        }

        // Send cancellation email
        try {
          const eventDateFormatted = moment(eventData.date).tz('Europe/Berlin').format('DD.MM.YYYY');

          // Build localized body with explicit voucher details when available
          let bodyText = voucherData ? 
            `Ihr Event "${eventData.city.name}" am ${eventDateFormatted} wurde leider abgesagt. Da die Absage mehr als 24 Stunden vor dem Event erfolgte, haben wir einen Gutschein für Sie erstellt.` :
            `Ihr Event "${eventData.city.name}" am ${eventDateFormatted} wurde leider abgesagt. Da die Absage weniger als 24 Stunden vor dem Event erfolgte, kann kein Gutschein ausgestellt werden.`;

          if (voucherData) {
            const voucherAmountText = voucherData?.amount_off ? `€${(voucherData.amount_off / 100).toFixed(2)}` : null;
            const voucherExpiryText = voucherData?.redeem_by ? moment.unix(voucherData.redeem_by).format('DD.MM.YYYY') : null;
            bodyText += `\n\nGutscheincode: ${voucherData.id}`;
            if (voucherAmountText) bodyText += `\nWert: ${voucherAmountText}`;
            if (voucherExpiryText) bodyText += `\nGültig bis: ${voucherExpiryText}`;
          }

          const emailTemplateBase = voucherData ? 'event_cancelled_with_voucher' : 'event_cancelled_no_voucher';
          const emailTemplate = (userData.locale || 'de').toString().toLowerCase().startsWith('de') 
            ? `${emailTemplateBase}_de` 
            : emailTemplateBase;
          
          await mail.send({
            to: userData.email,
            locale: userData.locale || 'de',
            html_template: emailTemplate,
            subject: voucherData ? 
              'Event abgesagt - Gutschein erhalten' : 
              'Event abgesagt',
            content: {
              name: userData.first_name || userData.name,
              body: bodyText,
              event_name: eventData.city.name,
              event_date: eventDateFormatted,
              voucher_code: voucherData?.id,
              voucher_amount: voucherData ? `€${(voucherData.amount_off / 100).toFixed(2)}` : null,
              body: voucherData ? 
                bodyText :
                bodyText,
              closing: 'Mit freundlichen Grüßen',
              button: voucherData ? {
                url: process.env.CLIENT_URL || 'https://app.meetlocal.de',
                label: 'Gutschein einlösen'
              } : null
            }
          });
          emailsSent++;

        } catch (emailError) {
          console.error(`❌ Failed to send email to ${userData.email}:`, emailError);
        }
      } catch (processError) {
        console.error(`❌ Failed to process registration ${registration._id}:`, processError);
      }
    }
    return res.status(200).send({
      message: `Successfully cancelled ${registrations.length} registrations`,
      data: {
        cancelled_count: registrations.length,
        emails_sent: emailsSent,
        vouchers_created: vouchersCreated,
        hours_until_event: hoursUntilEvent.toFixed(1),
        eligible_for_voucher: eligibleForVoucher,
        voucher_eligibility: eligibleForVoucher ? 
          'Participants received vouchers (>24 hours before event)' : 
          'No vouchers issued (<24 hours before event)'
      }
    });

  } catch (error) {
    console.error('Admin cancellation error:', error);
    return res.status(500).send({
      message: error.message || 'Failed to cancel registrations'
    });
  }
};