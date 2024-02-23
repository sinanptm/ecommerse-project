const { User } = require("../../models/userModels");
const { sendNewPass, deleteExpiredOTPs, sendOTPs } = require("../../config/sendMail");
const { OTP } = require("../../models/otpModel");
const { makeHash, bcryptCompare, generateToken } = require("../../util/validations")

// * User registation page 
const loadRegister = async (req, res) => {
  try {
    res.render("sign");
  } catch (err) {
    res.render('sign', { msg: err.message })
  }
};


const checkUsers = async () => {
  try {
    return await User.deleteMany({ is_verified: false });
  } catch (error) {
    console.error(error.message);
  }
};



// * user registration validation

const checkRegister = async (req, res) => {
  try {
    await checkUsers()
    const { email, password, username, number, name, gender } = await req.body;
    const secPass = await makeHash(password);

    const newUser = new User({
      name: name,
      password: secPass,
      phone: number,
      email: email,
      gender: gender,
      username: username,
      createdate:new Date()
    });
    const savedUser = await newUser.save();
    req.session.OTPId = savedUser._id.toString();
    res.redirect(`/verifyOTP?email=${email}`);

  } catch (error) {
    if (error.code === 11000) {
      res.render("sign", { msg: "Email already exists" });
    } else {
      console.error(error);
      res.render("sign", { msg: error.message });
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
    res.redirect("/OTP?msg=" + error.message);
  }
};

// * OTP page

const newOTP = async (req, res) => {
  const msg = req.query.msg
  res.render("otp", { msg, email: req.session.pmail });
};

// * OTP validation 

const verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // Check if email and otp are provided
    if (!email || !otp) {
      delete req.session.OTPId;
      return res.render("otp", { msg: `Provide values for email ${email}`, email: req.session.pmail, });
    }

    const matchedRecord = await OTP.findOne({ email: email });

    if (!matchedRecord) {
      delete req.session.OTPId;
      return res.render("otp", { msg: "No OTP found for the provided email.", email: req.session.pmail, });
    }

    if (matchedRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ email });
      return res.render("otp", { msg: "OTP code has expired. Request a new one.", email: req.session.pmail, });
    }

    if (await bcryptCompare(otp, matchedRecord.otp)) {
      // Correct OTP

      await OTP.deleteOne({ email: email });
      const veriy = await User.updateOne({ email }, { $set: { is_verified: true } });

      // const token = await generateToken(veriy._id);

      // req.session.token = token;
      // res.cookie("token", token, {
      //   maxAge: 30 * 24 * 60 * 60 * 1000,
      // });


      // await User.updateOne(
      //   { email },
      //   { $set: { token: token } },
      //   { upsert: true }
      // );

      delete req.session.OTPId;
      return res.redirect("/login");
    } else {
      return res.render("otp", { msg: "OTP Is Incorrect", email: req.session.pmail, });
    }

  } catch (error) {
    delete req.session.OTPId;
    console.log(error.message);
    res.render("otp", { msg: error.message, email: req.session.pmail, });
  }
};




// * for  login paage 
const loadLogin = async (req, res) => {
  try {
    const toast = req.query.toast
    res.render("login", { toast, });
  } catch (err) {
    res.render("login"), { msg: err.message };
  }
};

// * for valodationg the loging user

const checkLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne(
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
    const data = await User.findOne({ email });
    if (data) {
      if (await bcryptCompare(password, data.password)) {
        const data = await User.findOne({ email });
        token = await generateToken(data._id.toString());
        req.session.token = token;
        res.cookie("token", token, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const user = await User.updateOne(
          { email },
          { $set: { token: token } },
          { upsert: true }
        );
        res.redirect("/home")
      } else {
        res.render("login", { toast: "Incorrect password.", msg: "Incorrect password.", });
      }
    } else {
      res.render("login", { msg: "Incorrect email and password.", toast: "Incorrect email and password.", });
    }
  } catch (error) {
    res.render("login", { msg: error.message, toast: "Incorrect email and password.", });
  }
};


// * for loading the password reset 

const loadresetmail = async (req, res) => {
  try {
    res.render("resetmail",{send:false})
  } catch (error) {
    res.status(404).redirect("/login?toast=Page Not Found")
  }
}

// * for checking the new password

const sendresetmail = async (req, res) => {
  try {
    let email
    if (req.query.email) {
      email = req.query.email
    }else{
      email  = req.body.email
    }
    email = email.trim()

    const user = await User.findOne({ email })
    if (!user) {
      res.render("resetmail", { msg: "your Not a registered user",send:false})
      return
    }
    await sendNewPass({
      email,
      message: `This mail is for resetting password for TRENDS`,
      subject: "Password Restting",
      duration: 4,
      req,
    });
    return res.status(200).render('resetmail',{send:true})

  } catch (error) {
    res.render("resetmail", { msg: error.message ,send:false})
  }
}

// * to load the new the page for new password

const loadnewPassword = async (req, res) => {
  let { otp, email } = req.query
  otp = otp.trim()
  email = email.trim()
  try {

    if (!email || !otp) {
      res.status(404).send("page Not Fount")
      return
    }

    const matchedRecord = await OTP.findOne({ otp, email });
    if (!matchedRecord) {
      res.status(404)
      res.redirect(`/error-page?msg=page Not Fount. Plese Requst For a new one&&toast=to reset your password request for new mail `)

      return
    }

    if (matchedRecord.expiresAt < Date.now()) {
      res.status(404)
      res.redirect(`/error-page?msg=Link Expired. Please Request For a new link&&toast=to reset your password request for new mail `)
      await OTP.deleteOne({ email });
      return
    }

    await res.render("resetPassword", { email: email });

  } catch (error) {
    res.render("resetPassword", { email: email, msg: error.message });
  }
}

// * to add new password

const checkNewPassword = async (req, res) => {
  try {
    const { password, email } = req.body
    const secPass = await makeHash(password);
    const data = await User.findOneAndUpdate({ email }, { $set: { password: secPass } })
    if (req.session.token||req.cookies.token) {
      res.redirect('/account?toast=Password Changed')
    }else{
      res.redirect("/login")
    }
  } catch (error) {
    res.status(404).render("login", { toast: error.message });
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
    res.status(500).send("Internal Server Error");
  }
};





module.exports = {
  loadLogin,
  checkLogin,
  loadRegister,
  checkRegister,
  loadOTP,
  verifyOTP,
  newOTP,
  userLogout,
  sendresetmail,
  loadresetmail,
  loadnewPassword,
  checkNewPassword,
};
