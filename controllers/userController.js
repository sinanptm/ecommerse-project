const userModels = require("../models/userModels");
const { sendOTPs } = require("../config/sendOTP");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const jwt = require("jsonwebtoken");
const { secret } = require("../config/lock");

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err.message);
  }
};

const checkLogin = async (req, res) => {
  try {
    const { email, password, duration, message, subject } = req.body;
    const data = await userModels.User.findOne({ email });
    if (data) {
      if (await bcrypt.compare(password, data.password)) {
        req.session.OTPId = data._id.toString();
        res.redirect(`/verifyOTP?email=${email}`);
      } else {
        res.render("login", { msg: "Incorrect password." });
      }
    } else {
      res.render("login", { msg: "Incorrect email and password." });
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};


const newOTP = async(req,res)=>{
  res.render("otp", { email :req.session.pmail});
  
}

const loadOTP = async (req, res) => {
  try {
    const { email, message, duration, subject } = req.query;
    const OTP = await sendOTPs({
      email,
    });
    req.session.pmail = email
    res.redirect("/OTP")
  } catch (error) {
    console.log(error);
  }
};

const securePassword = async (pass) => {
  try {
    return await bcrypt.hash(pass, 10);
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  try {
    if (!email || !otp) {
      delete req.session.OTPId;
      throw Error(`Provide values for email ${email} and OTP ${otp}`);
    }

    const matchedRecord = await otpModel.OTP.findOne({ email: email });
    if (!matchedRecord) {
      delete req.session.OTPId;
      throw Error("No OTP found for the provided email");
    }

    if (matchedRecord.expiresAt < Date.now()) {
      await otpModel.OTP.deleteOne({ email });
      delete req.session.OTPId;
      res.render("otp", { msg: "OTP code has expired. Request a new one." });
      throw Error("OTP code has expired. Request a new one");
    }

    if (await bcrypt.compare(otp, matchedRecord.otp)) {
      const data = await userModels.User.findOne({ email: email });
      const token = securePassword(data._id.toString());
      req.session.token = token;
      res.cookie("token", token.toString(), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Delete OTP record and session variable after setting the token and cookie
      await otpModel.OTP.deleteOne({ email: email });
      delete req.session.OTPId;

      // Redirect to home after cleanup
      res.redirect("/home");
    } else {
      res.render("otp", {
        msg: "Incorrect OTP. Please try again.",
        email: email,
      });
    }
  } catch (error) {
    delete req.session.OTPId;
    console.log(error.message);
    res.status(404).json(error.message);
  }
};


const checkRegister = async (req, res) => {
  try {
    const { email, password, username, number, name, gender } = await req.body;
    const secPass = await securePassword(password);

    const newUser = new userModels.User({
      name: name,
      password: secPass,
      number: number,
      email: email,
      gender: gender,
      username: username,
    });
    const savedUser = await newUser.save();
    console.log(
      "User registered with id :",
      savedUser._id + " and the name:" + savedUser.name
    );
    res.render("login", { msg: "User registration successful. Please login." });
  } catch (error) {
    if (error.code === 11000) {
      res.render("sign", { msg: "Email already exists" });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("sign");
  } catch (err) {
    console.log(err.message);
  }
};

const loadHome = async (req, res) => {
  res.render("cart")
};

module.exports = {
  loadHome,
  loadLogin,
  checkLogin,
  loadRegister,
  checkRegister,
  securePassword,
  loadOTP,
  verifyOTP,
  newOTP
};
