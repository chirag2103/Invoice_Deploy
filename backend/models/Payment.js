import mongoose from 'mongoose';
const paymentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  remarks: String,
  date: {
    type: Date,
    required: true,
    get: function (date) {
      return date.toISOString().split('T')[0];
    },
  },
});

export default mongoose.model('Payment', paymentSchema);
