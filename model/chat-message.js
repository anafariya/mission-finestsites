const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ConfirmedMatch = require('./confirm-match').schema;

const ChatMessageSchema = new Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfirmedMatch',
    required: true,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: ''
  },
  images: {
    type: [String], // Array of S3 keys or URLs
    default: [],
  },
  read: {
    type: Boolean,
    default: false,
  },
  sent_at: {
    type: Date,
    default: Date.now,
  },
}, {
  versionKey: false,
  timestamps: true,
});

// Model
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema, 'chat-message');
exports.schema = ChatMessage;

exports.findOne = async function({chatId}) {
  return await ChatMessage.findOne({
          chat_id: chatId
        })
        .sort({ sent_at: -1 })
        .lean();
}

exports.find = async function({chatId, limit}) {
  return await ChatMessage.find({
          chat_id: chatId
        })
        .sort({ sent_at: -1 })
        .limit(parseInt(limit));
}

exports.getLastMessage = async function (chatId) {
  return await ChatMessage.findOne({ chat_id: chatId })
    .sort({ sent_at: -1 })
    .lean();
};