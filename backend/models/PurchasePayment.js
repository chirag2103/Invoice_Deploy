import mongoose from 'mongoose';
const purchasePaymentSchema = mongoose.Schema({
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
    get: function (date) {
      return date.toISOString();
    },
  },
});

export default mongoose.model('PurchasePayment', purchasePaymentSchema);
