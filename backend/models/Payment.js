import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Please provide customer'],
  },
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    required: [true, 'Please provide invoice'],
  },
  amountPaid: {
    type: Number,
    required: [true, 'Please provide amount paid'],
    min: [0, 'Amount cannot be negative'],
  },
  paymentMode: {
    type: String,
    required: [true, 'Please provide payment mode'],
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'other'],
  },
  referenceNumber: {
    type: String,
  },
  date: {
    type: Date,
    required: [true, 'Please provide payment date'],
    get: function (date) {
      return date.toISOString().split('T')[0];
    },
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
});

// Indexes for better query performance
paymentSchema.index({ customer: 1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ createdBy: 1 });
paymentSchema.index({ date: -1 });
paymentSchema.index({ createdAt: -1 });

// Virtual populate to get customer details
paymentSchema.virtual('customerDetails', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get invoice details
paymentSchema.virtual('invoiceDetails', {
  ref: 'Invoice',
  localField: 'invoice',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get user details
paymentSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model('Payment', paymentSchema);
