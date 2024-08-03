import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN,
  });
};
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  console.log('hello');
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export default mongoose.model('User', userSchema);
