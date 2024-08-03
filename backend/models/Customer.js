import mongoose from 'mongoose';
const customerSchema = mongoose.Schema({
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
});

export default mongoose.model('Customer', customerSchema);
