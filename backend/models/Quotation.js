import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
});

const quotationSchema = new mongoose.Schema({
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
  quoteNo: {
    type: String,
    required: true,
    unique: true,
  },
  quotationProducts: [productSchema],
  date: { type: Date, required: true },
  gst: { type: Number, default: 9 },
  invoiceTotal: Number,
  grandTotal: Number,
});

export default mongoose.model('Quotation', quotationSchema);
