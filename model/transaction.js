const mongoose = require('mongoose');
const utility = require('../helper/utility');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participant_id: { type: Schema.Types.ObjectId, ref: 'RegisteredParticipant' },
  sub_participant_id: { type: [Schema.Types.ObjectId], ref: 'RegisteredParticipant', default: null },
  invited_user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  type: {
    type: String,
    enum: ['Buy Hearts', 'Register Event'],
    required: true,
  },
  amount: { type: Number, required: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'EventManagement' },
  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  quantity: { type: Number, default: 1 },
}, { versionKey: false, timestamps: true });


const Transaction = mongoose.model('Transaction', TransactionSchema, 'transactions');
exports.schema = Transaction;

/*
* transaction.getById()
*/
exports.getByUserId = async function ({ user_id }) {
  let data = await Transaction
    .find({ user_id });

  if (data?.length){
    data = data.map((dt) => {
      return {
        date: utility.formatDateString(dt.createdAt),
        item: dt.type,
        amount: dt.amount,
        quantity: dt.quantity,
        payment_status: dt.status,
        id: dt._id
      }
    })
  }

  return data;
};

/*
* transaction.getByEventId()
*/
exports.getByEventId = async function ({ event_id }) {
  let data = await Transaction
    .find({ event_id })
    .populate('user_id', 'first_name last_name id date_of_birth name')
    .populate('invited_user_id', 'first_name last_name id date_of_birth name');;

  return data;
};

/*
* transaction.getByEventIdCron()
*/
exports.getByEventIdCron = async function ({ event_id }) {
  let data = await Transaction
    .find({ event_id, status: 'paid' })
    .populate('user_id', '_id date_of_birth name')
    .populate('invited_user_id', '_id date_of_birth name');;

  return data;
};