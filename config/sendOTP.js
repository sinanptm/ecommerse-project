const { OTP }= require("../models/otpModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt")
// const { securePassword } = require("../controllers/userController");
const { pass , mail ,  } = require("../config/lock");
const Mail = require("nodemailer/lib/mailer");

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

var sendOTPs = async ({ email, subject="TRENDS OTP verification", message = "Thankyou for connecting with us ", duration = 1 }) => {
  try {
    if (!email && subject && message) {
      throw Error("Provide values for email, message, and password");
    }
    await OTP.deleteOne({ email });
    const otp = await generateOTP();
    const mailOption = {
      from: mail,
      to: email,
      subject,
      html: `<p>${message}</p><p style="color:tomato;font-size:25px:25px;letter-spacing:2px;">${otp}</p><p>this code <b>expires on ${duration} hour(s)</b></p>`,
    };

    await sendMail(mailOption);
    const hashOTP = await hasssss(otp.trim());
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




module.exports ={ sendOTPs  }
