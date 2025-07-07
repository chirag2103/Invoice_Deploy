export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // ✅ only send over HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // ✅ essential for cross-origin cookies
  };

  const { password, ...userWithoutPassword } = user.toObject();

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user: userWithoutPassword,
    token,
  });
};
