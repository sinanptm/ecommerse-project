const OTP = require("../models/otpModel");
const nodemailer = require("nodemailer");
const controllers = require("../controllers/userController");
const { pass } = require("../config/lock");

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
    user: "muhammedsinan0549@gmail.com",
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

var sendOTP = async ({ email, subject, message, duration = 1 }) => {
  try {
    if (!email && subject && message) {
      throw Error("Provide values for email, message, and password");
    }
    await OTP.deleteOne({ email });
    const otp = await generateOTP();
    const mailOption = {
      from: AUTH_EMAIL,
      to: email,
      subject,
      html: `<p>${message}</p><p style="color:tomato;font-size:25px:25px;letter-spacing:2px;">${otp}</p><p>this code <b>expires on ${duration} hour(s)</b></p>`,
    };

    await sendMail(mailOption);
    const hashOTP = await controllers.securePassword(otp);
    const newOTP = await new OTP({
      email,
      otp: hashOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 * duration,
    });

    const OTPrecord = await newOTP.save();
    return OTPrecord;
  } catch (err) {
    throw err;
  }
};

module.exports = sendOTP;
