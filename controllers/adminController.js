const adminModel = require("../models/userModels");
const { sendOTPs } = require("../config/sendOTP");
const otpModel = require("../models/otpModel");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { secret } = require("../config/lock");

// ! Admin Login
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
    const data = await adminModel.Admin.findOne({ email });
    if (data) {
      if (await bcrypt.compare(password, data.password)) {
        req.session.OTPId = data._id.toString();
        res.redirect(`/admin/verifyAdmin?email=${email}`);
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

const newOTP = async (req, res) => {
  res.render("verficationOTP", { email: req.session.pmail });
};

const loadOTP = async (req, res) => {
  try {
    const { email, message, duration, subject } = req.query;
    const OTP = await sendOTPs({
      email,
      message: "Thank you admin",
      duration,
      subject: "Admin verification",
    });
    req.session.pmail = email;
    res.redirect("/admin/verifyOTP");
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
      res.render("verficationOTP", {
        msg: "OTP code has expired. Request a new one.",
      });
      throw Error("OTP code has expired. Request a new one");
    }

    if (await bcrypt.compare(otp, matchedRecord.otp)) {
      const data = await adminModel.Admin.findOne({ email: email });
      const token = securePassword(data._id.toString());
      req.session.adminToken = token;
      res.cookie("adminToken", token.toString(), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      await otpModel.OTP.deleteOne({ email: email });
      delete req.session.OTPId;

      res.redirect("/admin/dashboard");
    } else {
      res.render("verficationOTP", {
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

//! dashboard--user_managment

const loadUser = async (req, res) => {
  try {
    const msg =  req.query.msg 
    const users = await adminModel.User.find();
    res.render("users-list", { users, msg });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ! User Blocking
const userBlock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToBlock = await adminModel.User.updateOne(
      { _id: id },
      { status: "Blocked" }
    );
    if (!userToBlock) {
      return res.status(404).send("User not found");
    }
    res.status(200);
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error blocking user:", error);
    res.redirect("/admin/users?msg="+error.message);

  }
};
// ! User unblocking
const userUnblock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToUnBlock = await adminModel.User.updateOne(
      { _id: id },
      { status: "Active" }
    );
    if (!userToUnBlock) {
      return res.status(404).send("Blocked user not found");
    }
    res.status(200).redirect("/admin/users");
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.redirect("/admin/users?msg="+error.message);
  }
};

// ! User Adding
const addUser = async (req, res) => {
  try {
    const { email, password, username, number, name, gender } = await req.body;
    const secPass = await securePassword(password);

    const newUser = new adminModel.User({
      name: name,
      password: secPass,
      phone: number,
      email: email,
      gender: gender,
      username: username,
      createdate: Date.now(),
    });
    const savedUser = await newUser.save();
    console.log(
      "User registered with id :",
      savedUser._id + " and the name:" + savedUser.name
    );
    res.redirect("/admin/users");
  } catch (error) {
    if (error.code === 11000) {
      const users = await adminModel.User.find();
      res.render("users-list", { msg: "Email already exists", users });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.clearCookie("adminToken");
        res.redirect("/admin/login");
      }
    });
  } catch (err) {

  }
};

module.exports = {
  loadLogin,
  loadOTP,
  verifyOTP,
  newOTP,
  checkLogin,
  loadUser,
  userBlock,
  userUnblock,
  addUser,
  logout,
};
