import nodeMailer from 'nodemailer';

export const sendEmail = async (options) => {
  // let testAccount = await nodeMailer.createTestAccount();
  const transporter = nodeMailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    secureConnection: false,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
      // user: testAccount.user,
      // pass: testAccount.pass,
      // user: process.env.SMPT_MAIL,
      // pass: process.env.SMPT_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};
