import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
});

const invoiceSchema = mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true,
  },
  invoiceNo: {
    type: String,
    unique: true,
    required: true,
  },
  challanNo: String,
  gst: Number,
  challanDate: Date,
  invoiceProducts: [productSchema],
  invoiceTotal: Number,
  paidAmount: Number,
  remainingAmount: Number,
  grandTotal: Number,
  date: {
    type: Date,
    required: true,
  },
});

invoiceSchema.pre('save', function (next) {
  this.remainingAmount = this.invoiceTotal - this.paidAmount;

  next();
});

export default mongoose.model('Invoice', invoiceSchema);
