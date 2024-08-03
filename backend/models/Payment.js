import mongoose from 'mongoose';
const paymentSchema = mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    get: function (date) {
      return date.toISOString().split('T')[0];
    },
  },
});

export default mongoose.model('Payment', paymentSchema);
