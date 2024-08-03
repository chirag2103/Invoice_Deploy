import catchAsyncError from '../middlewares/catchAsyncError.js';
import User from '../models/userModel.js';
import ErrorHandler from '../utils/errorHandler.js';
import { sendToken } from '../utils/jwtToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
export const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: 'this is temp id',
      url: 'temp url',
    },
  });
  sendToken(user, 201, res);
});
export const loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler('Please Enter Password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }
  let isPasswordMatched = await user.matchPassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }
  sendToken(user, 200, res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie('token', null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(200).json({
    sucess: true,
    message: 'Logged Out',
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Get reset password token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/user/password/reset/${resetToken}`;

  const message = `Your password reset token is :\n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });
    res.status(200).json({
      sucess: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(`${error.message}`, 500));
  }
});

// Reset Password

export const resetPassword = catchAsyncError(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        'Reset password token is invalid or has been expired',
        404
      )
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('password does not same', 400));
  }
  user.password = req.body.password;
  console.log(user.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

// Get User Detail
export const getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    sucess: true,
    user,
  });
});

// Update Password

export const updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old Password is incorredct', 400));
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler('password does not match', 400));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res);
});

// Update user profile

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
});

// Get all users(admin)
export const getAlluser = catchAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// Get Single user(admin)
export const getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id :${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Role ---admin

export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id :${req.params.id}`)
    );
  }
  await user.remove();
  res.status(200).json({
    success: true,
    message: 'User Deleted Successfully',
  });
});
