import mongoose from 'mongoose';

const purchasePaymentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    remarks: String,
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

purchasePaymentSchema.index({ user: 1, date: 1 });
purchasePaymentSchema.index({ user: 1, seller: 1, date: 1 });

export default mongoose.model('PurchasePayment', purchasePaymentSchema);
