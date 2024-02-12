const { OTP } = require("../models/otpModel");
const { nodemailer } = require("../util/modules")
const { makeHash } = require("../util/validations")
require("dotenv").config()


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
    user: process.env.OTP_MAIL,
    pass: process.env.OTP_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.log('Mail Serviece:',err);
  } else {
    console.log('Mail Serviece:',success);
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
      from: process.env.OTP_MAIL,
      to: email,
      subject,
      html: `
        <p>${message}</p>
        <p>Your OTP verification code is: <span style="color: tomato; font-size: 25px; letter-spacing: 2px;">${otp}</span></p>
        <p>This code expires in <b>${duration} minute(s)</b>.</p>
      `,
    };

    await sendMail(mailOption);

    const hashOTP = await makeHash(otp.trim());
    const expirationTime = new Date(new Date().getTime() + duration * 60 * 1000);
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


const sendNewPass = async ({ email, subject = "TRENDS Forget Password", message = "Thank you for connecting with us", duration = 1 }) => {
  try {
    if (!email && subject && message) {
      throw Error("Provide values for email, message, and password");
    }

    // Delete expired OTPs before sending a new one
    await deleteExpiredOTPs();

    const otp = await generateOTP();
    const mailOption = {
      from: process.env.OTP_MAIL,
      to: email,
      subject,
      html: `
        <p>${message}</p>
        <p>To To-resert Your Passeord : <span style="color: tomato; font-size: 25px; letter-spacing: 2px;"><a href="http://127.0.0.1:3333/resetpassword?otp=${otp}&&email=${email}">Click me<a></span></p>
        <p>This link expires in <b>${duration} minute(s)</b>.</p>
      `,
    };

    await sendMail(mailOption);

    const durationInMinutes = 5; // Set the desired number of minutes
    const expirationTime = new Date(new Date().getTime() + durationInMinutes * 60 * 1000);

    
    const newOTP = await new OTP({
      email,
      otp: otp.trim(),
      createdAt: Date.now(),
      expiresAt: expirationTime,
    });

    const OTPrecord = await newOTP.save();
    return OTPrecord;
  } catch (err) {
    throw err;
  }
};

module.exports = { sendOTPs, deleteExpiredOTPs, sendNewPass };
