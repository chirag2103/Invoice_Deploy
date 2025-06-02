import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name :'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please enter your email :'],
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password :'],
    minLength: [8, 'password should be greater than 8 characters'],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  companyDetails: {
    name: {
      type: String,
      required: [true, 'Please enter company name'],
    },
    address: {
      type: String,
      required: [true, 'Please enter company address'],
    },
    gstin: {
      type: String,
      required: [true, 'Please enter GSTIN'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Please enter contact number'],
    },
  },
  bankDetails: {
    bankName: {
      type: String,
      required: [true, 'Please enter bank name'],
    },
    accountNumber: {
      type: String,
      required: [true, 'Please enter account number'],
    },
    ifscCode: {
      type: String,
      required: [true, 'Please enter IFSC code'],
    },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '5d',
    }
  );
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export default mongoose.model('User', userSchema);
