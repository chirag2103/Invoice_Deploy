import mongoose from 'mongoose';
const customerSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  gstNo: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: 'V.U Nagar,Anand',
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('Customer', customerSchema);
