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
    openingBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

sellerSchema.index({ user: 1, name: 1 }, { unique: true });

sellerSchema
  .virtual('gstNo')
  .get(function () {
    return this.gstNumber;
  })
  .set(function (value) {
    this.gstNumber = value;
  });

const Seller = mongoose.model('Seller', sellerSchema);
export default Seller;
