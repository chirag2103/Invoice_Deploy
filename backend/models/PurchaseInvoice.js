import mongoose from 'mongoose';

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
    },
    // paid: {
    //   type: Number,
    //   default: 0,
    // },
    // status: {
    //   type: String,
    //   default: 'pending',
    // },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // assuming you have a User model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseInvoice = mongoose.model(
  'PurchaseInvoice',
  purchaseInvoiceSchema,
  'purchaseinvoices_new'
);

export default PurchaseInvoice;
