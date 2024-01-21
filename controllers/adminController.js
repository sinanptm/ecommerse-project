const { User, Admin } = require("../models/userModels");
const { sendOTPs } = require("../config/sendMail");
const { OTP } = require("../models/otpModel");
const { makeHash, bcryptCompare } = require("../util/bcryption")

//  * Admin Login page 
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err.message);
  }
};


//  * Admin Login 
const checkLogin = async (req, res) => {
  try {
    const { email, password, duration, message, subject } = req.body;
    const data = await Admin.findOne({ email });
    if (data) {
      if (await bcryptCompare(password, data.password)) {
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

//  * otp page loading 
const newOTP = async (req, res) => {
  res.render("verficationOTP", { email: req.session.pmail });
};

//  * OTP sending
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


//  * OTP verification
const verifyOTP = async (req, res) => {

  let { email, otp } = req.body;
  otp = otp.trim()
  try {
    if (!email || !otp) {
      delete req.session.OTPId;
      res.render("verficationOTP", {
        msg: `Provide values for email ${email} a}`,
        email
      });
      return
    }

    const matchedRecord = await OTP.findOne({ email: email });
    if (!matchedRecord) {
      delete req.session.OTPId;
      res.render("verficationOTP", {
        msg: "No OTP found for the provided email",
        email
      });
      return
    }

    if (matchedRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ email });
      delete req.session.OTPId;
      res.render("verficationOTP", {
        msg: "OTP code has expired. Request a new one.",
      });
      res.render("verficationOTP", {
        msg: "OTP code has expired. Request a new one",
        email
      });
      return
    }

    if (await bcryptCompare(otp, matchedRecord.otp)) {
      const data = await Admin.findOne({ email: email });
      const token = await makeHash(data._id.toString());
      req.session.adminToken = token;
      res.cookie("adminToken", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      await Admin.updateOne({ email }, { $set: { token } });

      await OTP.deleteOne({ email: email });
      delete req.session.OTPId;

      res.redirect("/admin/dashboard");
    } else {
      res.render("verficationOTP", {
        msg: "Incorrect OTP. Please try again.",
        email: email,
      });
    }
  } catch (error) {
    let { email, otp } = req.body;


    delete req.session.OTPId;
    console.log(error.message);
    res.status(404).json(error.message);
  }
};

//  * dashboard--user_managment

const loadUser = async (req, res) => {
  try {
    const msg = req.query.msg
    const users = await User.find();
    res.render("users-list", { users, msg });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

//  * User Blocking
const userBlock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToBlock = await User.updateOne(
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
    res.redirect("/admin/users?msg=" + error.message);

  }
};
//  * User unblocking
const userUnblock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToUnBlock = await User.updateOne(
      { _id: id },
      { status: "Active" }
    );
    if (!userToUnBlock) {
      return res.status(404).send("Blocked user not found");
    }
    res.status(200).redirect("/admin/users");
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.redirect("/admin/users?msg=" + error.message);
  }
};



//  * Aadmin logout 
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
  logout,
};
