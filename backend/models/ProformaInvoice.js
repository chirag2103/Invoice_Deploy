import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
  hsn: {
    type: String,
    trim: true,
  },
});

const proformaInvoiceSchema = mongoose.Schema({
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
  shipTo: {
    name: { type: String },
    address: { type: String },
    gstNo: { type: String },
  },
  proformaNo: {
    type: Number,
    required: true,
  },
  sequenceNumber: {
    type: Number,
    required: true,
  },
  financialYearStart: {
    type: Number,
    required: false,
  },
  financialYearLabel: {
    type: String,
    trim: true,
  },
  orderNo: String,
  challanNo: String,
  gst: Number,
  gstType: {
    type: String,
    enum: ['intraState', 'interState'],
    default: 'intraState',
  },
  challanDate: Date,
  orderDate: Date,
  proformaProducts: [productSchema],
  invoiceTotal: Number,
  grandTotal: Number,
  date: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
  },
  termsAndConditions: { type: String, default: '' },
});

proformaInvoiceSchema.index(
  { user: 1, financialYearStart: 1, proformaNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      financialYearStart: { $exists: true },
    },
  }
);

export default mongoose.model('ProformaInvoice', proformaInvoiceSchema);
