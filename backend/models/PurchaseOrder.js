import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
});

const purchaseOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Seller',
    required: true,
  },
  poNo: {
    type: String,
    required: true,
  },
  poProducts: [productSchema],
  date: { type: Date, required: true },
  gst: { type: Number, default: 9 },
  invoiceTotal: Number,
  grandTotal: Number,
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
