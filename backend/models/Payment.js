import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
  {
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
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, date: 1 });
paymentSchema.index({ user: 1, customer: 1, date: 1 });

export default mongoose.model('Payment', paymentSchema);
