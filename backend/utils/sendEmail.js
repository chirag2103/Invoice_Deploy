import nodeMailer from 'nodemailer';
import config from '../config/index.js';
import ErrorHandler from './errorHandler.js';

export const sendEmail = async (options) => {
  if (!config.SMPT_MAIL || !config.SMPT_PASSWORD) {
    throw new ErrorHandler(
      'Email is not configured on the server. Please contact the administrator.',
      500
    );
  }

  const transporter = nodeMailer.createTransport({
    host: config.SMPT_HOST || 'smtp.gmail.com',
    service: config.SMPT_SERVICE || 'gmail',
    port: config.SMPT_PORT || 465,
    secure: (config.SMPT_PORT || 465) === 465,
    auth: {
      user: config.SMPT_MAIL,
      pass: config.SMPT_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: config.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};
