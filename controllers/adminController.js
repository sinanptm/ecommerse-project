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
  console.log("USE SIDE");

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
    const users = await adminModel.User.find();
    res.render("users-list", { users });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const userDetails = async (req, res) => {
  try {
    const userId = req.query.id;

    const user = await adminModel.User.findById(userId);

    if (user) {
      res.render("customer", { user });
    } else {
      res.send("User not found");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ! edit user
const userEdit = async (req, res) => {
  try {
    const { name, email, username, phone, gender } = req.body;
    const id = req.params.id;
    const user = await adminModel.User.updateOne(
      { _id: id },
      {
        $set: {
          name,
          email,
          username,
          phone,
          gender,
          updated: true,
        },
      }
    );

    if (user) {
      req.flash("success", "User details updated successfully.");
    } else {
      req.flash("error", "Failed to update user details.");
    }

    res.redirect("/admin/userdetails?id=" + id);
  } catch (error) {
    console.error("Error editing user:", error);
    req.flash("error", "Internal Server Error. Please try again later.");
    res.redirect("/admin/userdetails?id=" + id);
  }
};


// ! User Blocking
const userBlock = async (req, res) => {
  try {
    const id = req.params.id;

    const userToBlock = await adminModel.User.findById(id);
    if (!userToBlock) {
      return res.status(404).send("User not found");
    }

    const blockedUser = new adminModel.BlockedUser({
      email: userToBlock.email,
      userId: userToBlock._id,
    });
    await blockedUser.save();
    await adminModel.User.updateOne({ _id: id }, { status: "Blocked" });
    res.status(200);
    res.redirect("/admin/userdetails?id=" + id);
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).send("Internal Server Error");
  }
};
// ! User unblocking
const userUnBlock = async (req, res) => {
  try {
    const id = req.params.id;
    const blockedUser = await adminModel.BlockedUser.findOneAndDelete({
      userId: id,
    });
    if (!blockedUser) {
      return res.status(404).send("Blocked user not found");
    }

    await adminModel.User.updateOne({ _id: id }, { status: "Active" });

    res.status(200).redirect("/admin/userdetails?id=" + id);
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).send("Internal Server Error");
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
//! Controller for deleting user
const userDelete = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await adminModel.User.deleteOne({ _id: id });
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  loadLogin,
  loadOTP,
  verifyOTP,
  newOTP,
  checkLogin,
  loadUser,
  userDetails,
  userBlock,
  userDelete,
  userEdit,
  userUnBlock,
  addUser,
};
