import config from '../config/index.js';

export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() + config.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? 'None' : 'Lax',
  };

  const { password, ...userWithoutPassword } = user.toObject();

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user: userWithoutPassword,
    token,
  });
};
