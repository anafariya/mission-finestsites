const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegisteredParticipant = require('./registered-participant').schema;
const Events = require('./event-management').schema;

const ConfirmedMatchSchema = new Schema({
  user_ids: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  ],
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EventManagement', required: true },
  matched_at: { type: Date, default: Date.now },
  blocked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  block_reason: { type: String },
  block_date: { type: Date },
  is_unlock_chat: { type: Boolean },
  unlock_chat_at: { type: Date },
  unlock_chat_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_archive: { type: Boolean, default: false }
}, { timestamps: true });

// Model
const ConfirmedMatch = mongoose.model('ConfirmedMatch', ConfirmedMatchSchema, 'confirmed-match');
exports.schema = ConfirmedMatch;

exports.findOne = async function({idChat, userId, targetId, eventId}) {
  return await ConfirmedMatch.findOne(idChat ? {
          _id: idChat
        } : {
          user_ids: { $all: [userId, targetId] },
          ...eventId && { event_id: eventId }
        }).sort({ matched_at: -1 });
}

exports.update = async function({ userId, targetId, eventId, data = {}, chatId }) {
  const filter = chatId
    ? { _id: chatId }
    : {
        user_ids: { $all: [userId, targetId] },
        event_id: eventId,
      };
  const blockedId = data.blocked_by;
  delete data.blocked_by;
  const updateQuery = {
    $set: data,
    ...blockedId && { $addToSet: { blocked_by: blockedId }},
  };

  return await ConfirmedMatch.findOneAndUpdate(
    filter,
    updateQuery,
    { upsert: true, new: true }
  );
};

exports.getEventChats = async function({eventId}) {
  const matches = await ConfirmedMatch.aggregate([
      { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },

      // Populate users
      {
        $lookup: {
          from: 'user',
          localField: 'user_ids',
          foreignField: '_id',
          as: 'users'
        }
      },

      // Get last message per chat
      {
        $lookup: {
          from: 'chat-message',
          let: { chatId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chat_id', '$$chatId'] } } },
            { $sort: { sent_at: -1 } },
            { $limit: 1 }
          ],
          as: 'last_message'
        }
      },
      { $unwind: { path: '$last_message', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          users: {
            $map: {
              input: '$users',
              as: 'u',
              in: {
                _id: '$$u._id',
                name: '$$u.name',
                first_name: '$$u.first_name',
                last_name: '$$u.last_name',
              },
            },
          },
          last_message_by: '$last_message.sender_id',
          last_message_time: '$last_message.sent_at',
          status: {
            $cond: { if: '$is_archive', then: 'archive', else: 'active' }
          }
        }
      },
      {
        $project: {
          user_1: { $arrayElemAt: ['$users', 0] },
          user_2: { $arrayElemAt: ['$users', 1] },
          last_message_by: 1,
          last_message_time: 1,
          status: 1,
        },
      },
    ]);
    return matches;
}

exports.archiveChat = async function({chatId, isArchive}) {
  return await ConfirmedMatch.findOneAndUpdate({
          _id: chatId
        },{
          is_archive: isArchive
        }, { upsert: true, new: true });
}

exports.hasConfirmedMatch = async function({eventId, userId}) {
  return await ConfirmedMatch.exists({
    event_id: eventId,
    user_ids: userId,
  });
}