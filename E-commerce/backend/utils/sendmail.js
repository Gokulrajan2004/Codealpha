const nodemailer = require('nodemailer');

const sendMail = async (email, code, username = "User") => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const options = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "ToyCraze Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>Hi ${username},</h3>
        <p>Your OTP for ToyCraze account verification is:</p>
        <p style="font-size: 22px; font-weight: bold;">${code}</p>
        <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        <p>– ToyCraze Team</p>
      </div>
    `
  };

  await transporter.sendMail(options);
};

module.exports = sendMail;
