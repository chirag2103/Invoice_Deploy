import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // line-level discount %
  uom: { type: String, default: 'NOS' },
  hsn: {
    type: String,
    trim: true,
  },
});

const invoiceSchema = mongoose.Schema({
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
  }, // 👉 SHIP TO (OPTIONAL)
  invoiceNo: {
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
  invoiceProducts: [productSchema],
  invoiceTotal: Number,
  invoiceDiscount: { type: Number, default: 0 }, // invoice-level flat discount ₹
  grandTotal: Number,
  date: {
    type: Date,
    required: true,
  },
  termsAndConditions: { type: String, default: '' },
});

invoiceSchema.index(
  { user: 1, financialYearStart: 1, invoiceNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      financialYearStart: { $exists: true },
    },
  }
);

// invoiceSchema.pre('save', function (next) {
//   this.remainingAmount = this.invoiceTotal - this.paidAmount;

//   next();
// });

export default mongoose.model('Invoice', invoiceSchema);
