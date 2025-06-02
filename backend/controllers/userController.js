import catchAsyncError from '../middlewares/catchAsyncError.js';
import User from '../models/userModel.js';
import ErrorHandler from '../utils/errorHandler.js';
import { sendToken } from '../utils/jwtToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

// Register a new user
export const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, companyDetails, bankDetails } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return next(new ErrorHandler('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler('Email already registered', 400));
  }

  // Validate company details
  if (
    !companyDetails ||
    !companyDetails.name ||
    !companyDetails.address ||
    !companyDetails.gstin ||
    !companyDetails.contactNumber
  ) {
    return next(new ErrorHandler('Please provide all company details', 400));
  }

  // Validate bank details
  if (
    !bankDetails ||
    !bankDetails.bankName ||
    !bankDetails.accountNumber ||
    !bankDetails.ifscCode
  ) {
    return next(new ErrorHandler('Please provide all bank details', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    companyDetails,
    bankDetails,
    avatar: {
      public_id: 'default_avatar',
      url: 'https://example.com/default-avatar.png',
    },
  });

  sendToken(user, 201, res);
});

// Login user
export const loginUser = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Validate email and password
    if (!email || !password) {
      console.log('Missing email or password');
      return next(new ErrorHandler('Please provide email and password', 400));
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found');
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    // Check password
    const isPasswordMatched = await user.matchPassword(password);
    console.log('Password matched:', isPasswordMatched);

    if (!isPasswordMatched) {
      console.log('Password does not match');
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    // Generate token
    const token = user.getJWTToken();
    console.log('Token generated:', token ? 'Yes' : 'No');

    // Remove sensitive data
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyDetails: user.companyDetails,
      bankDetails: user.bankDetails,
      avatar: user.avatar,
    };

    // Set cookie options
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    // Send response with cookie
    res.status(200).cookie('token', token, options).json({
      success: true,
      token,
      user: userResponse,
    });

    console.log('Login successful, response sent');
  } catch (error) {
    console.error('Login error:', error);
    return next(new ErrorHandler('Login failed', 500));
  }
});

// Logout user
export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie('token', null, {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Forgot password
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler('Please provide an email address', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler('No user found with this email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${resetToken}`;
  const message = `Your password reset link:\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler('Email could not be sent', 500));
  }
});

// Reset password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  // Hash token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler('Invalid or expired reset token', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }

  // Update password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();
  sendToken(user, 200, res);
});

// Get current user details
export const getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Update password
export const updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check old password
  const isPasswordMatched = await user.matchPassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler('Current password is incorrect', 400));
  }

  // Validate new password
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }

  // Update password
  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  sendToken(user, 200, res);
});

// Update user profile
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email, companyDetails, bankDetails } = req.body;

  // Validate company details if provided
  if (companyDetails) {
    if (
      !companyDetails.name ||
      !companyDetails.address ||
      !companyDetails.gstin ||
      !companyDetails.contactNumber
    ) {
      return next(new ErrorHandler('Please provide all company details', 400));
    }
  }

  // Validate bank details if provided
  if (bankDetails) {
    if (
      !bankDetails.bankName ||
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode
    ) {
      return next(new ErrorHandler('Please provide all bank details', 400));
    }
  }

  const newUserData = {
    name: name,
    email: email,
    ...(companyDetails && { companyDetails }),
    ...(bankDetails && { bankDetails }),
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

// Get all users (admin only)
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// Get single user (admin only)
export const getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(
      new ErrorHandler(`No user found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update user role (admin only)
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const { name, email, role } = req.body;

  if (!role) {
    return next(new ErrorHandler('Please provide a role', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`No user found with id: ${req.params.id}`, 404)
    );
  }

  const newUserData = {
    name: name || user.name,
    email: email || user.email,
    role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
  });
});

// Delete user (admin only)
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`No user found with id: ${req.params.id}`, 404)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
