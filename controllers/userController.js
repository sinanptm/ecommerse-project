const userModels = require("../models/userModels");
const { sendNewPass, deleteExpiredOTPs,  sendOTPs } = require("../config/sendMail");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const { trusted } = require("mongoose");

// * User registation page 
const loadRegister = async (req, res) => {
  try {
    res.render("sign");
  } catch (err) {
    console.log(err.message);
  }
};


const checkUsers = async () => {
  try {
    const result = await userModels.User.deleteMany({ is_verified: false });
    console.log(`${result.deletedCount} users deleted`);
  } catch (error) {
    console.error(error.message);
  }
};



// * user registration validation

const checkRegister = async (req, res) => {
  try {
    await checkUsers()
    const { email, password, username, number, name, gender } = await req.body;
    const secPass = await securePassword(password);

    const newUser = new userModels.User({
      name: name,
      password: secPass,
      phone: number,
      email: email,
      gender: gender,
      username: username,
      createdate: Date.now(),
    });
    const savedUser = await newUser.save();
    req.session.OTPId = savedUser._id.toString();
    res.redirect(`/verifyOTP?email=${email}`);

  } catch (error) {
    if (error.code === 11000) {
      res.render("sign", { msg: "Email already exists" });
    } else {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

// * for sending otp 

const loadOTP = async (req, res) => {
  try {
    await deleteExpiredOTPs()
    const { email, message, duration, subject } = req.query;
    const OTP = await sendOTPs({
      email,
      message: "OTP verfication for TRENDS e-commerce",
      subject: "verification",
      duration: 2
    });

    req.session.pmail = email;
    res.redirect("/OTP");
  } catch (error) {
    console.log(error);
  }
};

// * OTP page

const newOTP = async (req, res) => {
  res.render("otp", { email: req.session.pmail });
};

// * for hashing datas using bcrypt

const securePassword = async (pass) => {
  try {
    pass = pass.trim()
    return await bcrypt.hash(pass, 10);
  } catch (error) {
    console.log(error.message);
  }
};

// * OTP validation 

const verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // Check if email and otp are provided
    if (!email || !otp) {
      delete req.session.OTPId;
      return res.render("otp", { msg: `Provide values for email ${email}`, email: req.session.pmail, valid: req.cookies.token });
    }

    const matchedRecord = await otpModel.OTP.findOne({ email: email });

    if (!matchedRecord) {
      delete req.session.OTPId;
      return res.render("otp", { msg: "No OTP found for the provided email.", email: req.session.pmail, valid: req.cookies.token });
    }

    if (matchedRecord.expiresAt < Date.now()) {
      await otpModel.OTP.deleteOne({ email });
      return res.render("otp", { msg: "OTP code has expired. Request a new one.", email: req.session.pmail, valid: req.cookies.token });
    }

    if (bcrypt.compareSync(otp, matchedRecord.otp)) {
      // Correct OTP

      await otpModel.OTP.deleteOne({ email: email });
      const veriy = await userModels.User.updateOne({ email }, { $set: { is_verified: true } });

      const token = await securePassword(veriy._id);

      req.session.token = token;
      res.cookie("token", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      await userModels.User.updateOne(
        { email },
        { $set: { token: token } },
        { upsert: true }
      );

      delete req.session.OTPId;
      return res.redirect("/home");
    } else {
      // Incorrect OTP
      return res.render("otp", { msg: "OTP Is Incorrect", email: req.session.pmail, valid: req.cookies.token });
    }

  } catch (error) {
    delete req.session.OTPId;
    console.log(error.message);
    return res.status(501).send(error.message);
  }
};




// * for  login paage 
const loadLogin = async (req, res) => {
  try {
    const toast = req.query.toast
    res.render("login", { toast, valid: req.cookies.token });
  } catch (err) {
    res.render("login"), { msg: err.message };
  }
};

// * for valodationg the loging user

const checkLogin = async (req, res) => {
  try {
    const { email, password, duration, message, subject } = req.body;

    const user = await userModels.User.findOne(
      { email: email.trim() }
    );
    if (!user) {
      res.redirect(`/login?toast=Your not a redistered User Please register`);
      return
    }
    if (user.is_verified == false) {
      res.redirect(`/login?toast=Your not a redistered User Please register`);
      return;
    }
    if (user.status === "Blocked") {
      res.redirect("/login?toast=Your Account Is Blocked By The Admin");
      return;
    }
    const data = await userModels.User.findOne({ email });
    if (data) {
      if (await bcrypt.compare(password, data.password)) {
        const data = await userModels.User.findOne({ email });
        const token = await securePassword(data._id.toString());

        req.session.token = token;
        res.cookie("token", token.toString(), {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const user = await userModels.User.updateOne(
          { email },
          { $set: { token: token } },
          { upsert: true }
        );
        res.redirect("/home")
      } else {
        res.render("login", { toast: "Incorrect password.",msg: "Incorrect password.", valid: req.cookies.token });
      }
    } else {
      res.render("login", { msg: "Incorrect email and password.", toast: "Incorrect email and password.", valid: req.cookies.token });
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};


// * for loading the password reset 

const loadresetmail = async (req, res) => {
  try {
    res.render("resetmail")
  } catch (error) {
    res.status(404).redirect("/login?msg=Page Not Found")
  }
}

// * for checking the new password

const sendresetmail = async (req, res) => {
  try {
    const { email } = req.body
    const user = await userModels.User.findOne({email})
    if (!user) {
      res.render("resetmail",{ msg:"your Not a registered user" })
    }
    const OTP = await sendNewPass({
      email,
      message:`This mail is for resetting password for TRENDS` ,
      subject: "Password Restting",
      duration: 4,
    });
    res.redirect("/sendreset")

  } catch (error) {
    res.status(501).json(error.message)
  }
}

// * to load the new the page for new password

const loadnewPassword = async (req,res)=>{
  try {
  let {otp,email} = req.query
  otp = otp.trim()
  email = email.trim()

    if (!email || !otp) {
      res.status(404).send("page Not Fount")
      return
    }

    const matchedRecord = await otpModel.OTP.findOne({ otp, email });
    if (!matchedRecord) {
      res.status(404).send("page Not Fount. Plese Requst For a new one");  
      return
    }

    if (matchedRecord.expiresAt < Date.now()) {
      res.status(404).send("Link Expired. Please Request For a new link");
      await otpModel.OTP.deleteOne({ email });

      return
    }

    await res.render("resetPassword", { email: email });

  } catch (error) {
     res.status(404).send(error.message);  
  }
}

// * to add new password

const checkNewPassword = async (req,res)=>{
  try {
    const {password,email} = req.body
    const secPass = await securePassword(password);
    const data = await userModels.User.findOneAndUpdate({email},{$set:{password:secPass}})
    res.redirect("/login")
  } catch (error) {
    res.status(404).send(error.message);  
  }
}

// * for user loging out

const userLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.clearCookie("token");
        res.redirect("/home");
      }
    });
  } catch (error) {
    console.log("Error in userLogout:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

 


module.exports = {
  loadLogin,
  checkLogin,
  loadRegister,
  checkRegister,
  securePassword,
  loadOTP,
  verifyOTP,
  newOTP,
  userLogout,
  sendresetmail,
  loadresetmail,
  loadnewPassword,
  checkNewPassword
};
