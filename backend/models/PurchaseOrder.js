import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  uom: { type: String, default: 'NOS' },
  hsn: {
    type: String,
    trim: true,
  },
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
    type: Number,
    required: true,
  },
  sequenceNumber: {
    type: Number,
    required: true,
  },
  financialYearStart: {
    type: Number,
  },
  financialYearLabel: {
    type: String,
    trim: true,
  },
  poProducts: [productSchema],
  date: { type: Date, required: true },
  gst: { type: Number, default: 9 },
  gstType: {
    type: String,
    enum: ['intraState', 'interState'],
    default: 'intraState',
  },
  invoiceTotal: Number,
  invoiceDiscount: { type: Number, default: 0 },
  grandTotal: Number,
  termsAndConditions: { type: String, default: '' },
  technicalSpecifications: { type: String, default: '' },
});

purchaseOrderSchema.index(
  { user: 1, financialYearStart: 1, poNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      financialYearStart: { $exists: true },
    },
  }
);

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
