const nodemailer = require('nodemailer');

// Sends an email using SMTP credentials from .env (works with Gmail, Mailtrap,
// SendGrid SMTP, etc). If you're just testing locally, https://mailtrap.io has
// a free sandbox inbox that's perfect for this — nothing gets sent to real users.
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TaskFlow <no-reply@taskflow.app>',
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
