// create token and saving in cookie
export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  // Send response with token
  res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};
