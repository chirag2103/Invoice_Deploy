import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Please provide an invoice number'],
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
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
  paymentTerms: {
    type: String,
  },
  transportMode: {
    type: String,
  },
  vehicleNumber: {
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
  eWayBillNumber: {
    type: String,
  },
});

// Indexes for better query performance
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ createdAt: -1 });

// Virtual populate to get user details
invoiceSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate to get customer details
invoiceSchema.virtual('customerDetails', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model('Invoice', invoiceSchema);
