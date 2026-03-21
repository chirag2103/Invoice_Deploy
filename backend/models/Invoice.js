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
  orderNo: String,
  challanNo: String,
  gst: Number,
  challanDate: Date,
  orderDate: Date,
  invoiceProducts: [productSchema],
  invoiceTotal: Number,
  grandTotal: Number,
  date: {
    type: Date,
    required: true,
  },
  termsAndConditions: { type: String, default: '' },
});

// invoiceSchema.pre('save', function (next) {
//   this.remainingAmount = this.invoiceTotal - this.paidAmount;

//   next();
// });

export default mongoose.model('Invoice', invoiceSchema);
