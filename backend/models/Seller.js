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
      unique: true, // prevent duplicates
      trim: true,
    },
    address: String,
    gstNumber: String,
    contact: String,
  },
  { timestamps: true }
);

const Seller = mongoose.model('Seller', sellerSchema);
export default Seller;
