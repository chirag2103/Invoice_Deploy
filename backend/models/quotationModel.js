import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: [true, 'Please provide a quotation number'],
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
      hsnCode: {
        type: String,
        required: [true, 'Please provide HSN code'],
      },
      quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: [0, 'Quantity cannot be negative'],
      },
      price: {
        type: Number,
        required: [true, 'Please provide price'],
        min: [0, 'Price cannot be negative'],
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative'],
      },
      cgst: {
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
      sgst: {
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
      igst: {
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  totalCgst: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSgst: {
    type: Number,
    required: true,
    min: 0,
  },
  totalIgst: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
  },
  roundOff: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  validUntil: {
    type: Date,
    required: [true, 'Please provide validity date'],
  },
  termsAndConditions: {
    type: String,
  },
  notes: {
    type: String,
  },
  placeOfSupply: {
    type: String,
    required: [true, 'Please provide place of supply'],
  },
  isReverseCharge: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  convertedToInvoice: {
    type: Boolean,
    default: false,
  },
  convertedInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
});

// Indexes for better query performance
quotationSchema.index({ createdBy: 1 });
quotationSchema.index({ customer: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ quotationNumber: 1 }, { unique: true });
quotationSchema.index({ createdAt: -1 });

// Virtual populate to get user details
quotationSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get customer details
quotationSchema.virtual('customerDetails', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get converted invoice details
quotationSchema.virtual('convertedInvoice', {
  ref: 'Invoice',
  localField: 'convertedInvoiceId',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model('Quotation', quotationSchema);
