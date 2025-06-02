import mongoose from 'mongoose';

const challanSchema = new mongoose.Schema({
  challanNumber: {
    type: String,
    required: [true, 'Please provide a challan number'],
    unique: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  department: {
    type: String,
  },
  items: [
    {
      description: {
        type: String,
        required: [true, 'Please provide item description'],
      },
      quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: [0, 'Quantity cannot be negative'],
      },
      unit: {
        type: String,
        required: [true, 'Please provide unit of measurement'],
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'delivered', 'cancelled'],
    default: 'pending',
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Please provide delivery date'],
  },
  vehicleNumber: {
    type: String,
  },
  transporterName: {
    type: String,
  },
  transportMode: {
    type: String,
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Please provide delivery address'],
  },
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Please provide contact person name'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide contact person phone'],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
  },
  deliveryNotes: {
    type: String,
  },
});

// Indexes for better query performance
challanSchema.index({ createdBy: 1 });
challanSchema.index({ customer: 1 });
challanSchema.index({ status: 1 });
challanSchema.index({ challanNumber: 1 }, { unique: true });
challanSchema.index({ createdAt: -1 });

// Virtual populate to get user details
challanSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get customer details
challanSchema.virtual('customerDetails', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model('Challan', challanSchema);
