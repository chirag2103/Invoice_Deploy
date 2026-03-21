import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: String,
    gstNumber: String,
    contact: String,
  },
  { timestamps: true },
);
// In Seller.js — replace unique: true on name with:
sellerSchema.index({ user: 1, name: 1 }, { unique: true });
const Seller = mongoose.model('Seller', sellerSchema);
export default Seller;
