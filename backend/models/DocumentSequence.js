import mongoose from 'mongoose';

const documentSequenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['invoice', 'quotation', 'challan', 'proforma'],
    },
    financialYearStart: {
      type: Number,
      required: true,
    },
    currentNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSequenceSchema.index(
  { user: 1, documentType: 1, financialYearStart: 1 },
  { unique: true, name: 'document_sequence_unique_idx' }
);

export default mongoose.model('DocumentSequence', documentSequenceSchema);
