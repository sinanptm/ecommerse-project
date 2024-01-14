const { OTP } = require("../models/otpModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { pass, mail } = require("./lock");

var generateOTP = async () => {
  try {
    return ` ${Math.floor(1000 + Math.random() * 9000)} `;
  } catch (err) {
    throw console.error();
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mail,
    pass: pass,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.log(err);
  } else {
    console.log(success);
  }
});

var sendMail = async (mailOption) => {
  try {
    await transporter.sendMail(mailOption);
    return;
  } catch (error) {
    throw error;
  }
};

const hasssss = async (pass) => {
  try {
    return await bcrypt.hash(pass, 10);
  } catch (error) {
    console.log(error.message);
  }
};

const deleteExpiredOTPs = async () => {
  try {
    // Find and delete all expired OTPs
    const result = await OTP.deleteMany({ expiresAt: { $lt: Date.now() } });

  } catch (error) {
    throw error;
  }
};

const sendOTPs = async ({ email, subject = "TRENDS OTP verification", message = "Thank you for connecting with us", duration = 1 }) => {
  try {
    if (!email && subject && message) {
      throw Error("Provide values for email, message, and password");
    }

    // Delete expired OTPs before sending a new one
    await deleteExpiredOTPs();

    const otp = await generateOTP();
    const mailOption = {
      from: mail,
      to: email,
      subject,
      html: `
        <p>${message}</p>
        <p>Your OTP verification code is: <span style="color: tomato; font-size: 25px; letter-spacing: 2px;">${otp}</span></p>
        <p>This code expires in <b>${duration} minute(s)</b>.</p>
      `,
    };

    await sendMail(mailOption);

    const hashOTP = await hasssss(otp.trim());
    const expirationTime = Date.now() + duration * 60 * 1000;
    const newOTP = await new OTP({
      email,
      otp: hashOTP,
      createdAt: Date.now(),
      expiresAt: expirationTime,
    });

    const OTPrecord = await newOTP.save();
    return OTPrecord;
  } catch (err) {
    throw err;
  }
};

module.exports = { sendOTPs, deleteExpiredOTPs };
