import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter customer name'],
    trim: true,
  },
  gstNo: {
    type: String,
    required: [true, 'Please enter GST number'],
    unique: true,
    validate: {
      validator: function (v) {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          v
        );
      },
      message: (props) => `${props.value} is not a valid GST number!`,
    },
  },
  address: {
    type: String,
    required: [true, 'Please enter address'],
  },
  contactNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  email: {
    type: String,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
customerSchema.index({ name: 1 });
customerSchema.index({ gstNo: 1 }, { unique: true });
customerSchema.index({ createdBy: 1 });

export default mongoose.model('Customer', customerSchema);
