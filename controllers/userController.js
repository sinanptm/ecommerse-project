const userModels = require("../models/userModels");
const { sendOTP } = require("../config/sendOTP");
const bcrypt = require("bcrypt");
const OTPs = require("../models/otpModel");

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err.message);
  }
};

const checkLogin = async (req, res) => {
  try {
    var user_mail = req.body.email;
    const { email, password, duration, messsage, subject } = await req.body;

    const data = await userModels.User.findOne({ email: email });
    if (data) {
      if (await bcrypt.compare(password, data.password)) {
          const OTP = await sendOTP({
              email,
              duration,
              messsage,
              subject,
            });
            res.status(200).json(OTP);
            res.redirect("/verifyOTP");
      } else {
        res.render("login", { msg: "Incorrect password." });
      }
    } else {
      res.render("login", { msg: "Incorrect email and password." });
    }
    
  } catch (error) {
    res.status(404).json(error)
  }
};

const loadOTP = (req, res) => {
  try {
    res.render("otp");
  } catch (error) {
    console.log(error);
  }
};

const verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  try {
    if (!email && otp) {
      throw Error("provide values for email and password");
    }
    const matchedRecord = await OTPs.OTP.findOne({ email: email });
    if (!matchedRecord) {
      throw Error("No otp Found ");
    }
    const { expiresAt } = matchedRecord;
    const OTP = matchedRecord.otp;
    if (expiresAt < Date.now()) {
      await OTP.deleteOne({ email });
      throw Error("OTP code has expired.request for new one");
    } else {
      if (await bcrypt.compare(otp, OTP)) {
        res.redirect("/home");
        const data = await userModels.User.findOne({ email: user_mail });
        req.session.user_id = data._id;
        res.cookie("userToken", data._id.toString(), {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.redirect("/home");
      }
    }
  } catch (error) {}
};


const securePassword = async (pass) => {
  try {
    const hashpass = await bcrypt.hash(pass, 10);
    return hashpass;
  } catch (error) {
    console.log(error.message);
  }
};

const checkRegister = async (req, res) => {
  try {
    const { email, password, username, number, name, gender } = await req.body;
    const secPass = securePassword(password);

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
      res.render("register", { msg: "Email already exists" });
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

const loadHome = async (req, res) => {};

module.exports = {
  loadHome,
  loadLogin,
  checkLogin,
  loadRegister,
  checkRegister,
  securePassword,
  loadOTP,
  verifyOTP
};
