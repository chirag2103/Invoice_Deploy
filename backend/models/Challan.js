import mongoose from 'mongoose';

const challanProductSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  uom: { type: String, default: 'NOS' },
});

const challanSchema = mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true,
  },
  challanNo: {
    type: String,
    unique: true,
    required: true,
  },
  challanProducts: [challanProductSchema],
  challanDate: {
    type: Date,
    required: true,
  },
  orderNo: String,
  orderDate: Date,
});

export default mongoose.model('Challan', challanSchema);
