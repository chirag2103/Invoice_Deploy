import mongoose from 'mongoose';

const challanProductSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
  hsn: {
    type: String,
    trim: true,
  },
});

const challanSchema = mongoose.Schema({
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
  challanNo: {
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
  challanProducts: [challanProductSchema],
  challanDate: {
    type: Date,
    required: true,
  },
  orderNo: String,
  orderDate: Date,
});

challanSchema.index(
  { user: 1, financialYearStart: 1, challanNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      financialYearStart: { $exists: true },
    },
  }
);

export default mongoose.model('Challan', challanSchema);
