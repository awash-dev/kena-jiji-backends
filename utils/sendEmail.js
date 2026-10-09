const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // Define mail options
  const mailOptions = {
    from: '"Kena Shop" <' + process.env.EMAIL_USER + '>',
    to: options.email || options.to,
    subject: options.subject,
    text: options.message || options.text,
    html: options.html || options.htm || null,
  };
  
  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
