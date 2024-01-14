const userModels = require("../models/userModels");
const { sendOTPs, deleteExpiredOTPs } = require("../config/sendOTP");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const { secret } = require("../config/lock");

// !  login and logout controllers
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    res.render("login"),{msg: err.message};
  }
};


const checkLogin = async (req, res) => {
  try {
    const { email, password, duration, message, subject } = req.body;
    const { status } = await userModels.User.findOne(
      { email: email.trim() },
      { status: 1, _id: 0 }
    );
    if (status === "Blocked") {
      res.render("login", { msg: "Your Account Is Blocked By The Admin" , valid:req.cookies.token});
      return;
    }
    const data = await userModels.User.findOne({ email });
    if (data) {
      if (await bcrypt.compare(password, data.password)) {
        req.session.OTPId = data._id.toString();
        res.redirect(`/verifyOTP?email=${email}`);
      } else {
        res.render("login", { msg: "Incorrect password." , valid:req.cookies.token});
      }
    } else {
      res.render("login", { msg: "Incorrect email and password." , valid:req.cookies.token});
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};


const loadOTP = async (req, res) => {
  try {
    await deleteExpiredOTPs()
    const { email, message, duration, subject } = req.query;
    const OTP = await sendOTPs({
      email,
      message:"OTP verfication for TRENDS e-commerce",
      subject:"verification",
      duration:2
    });

    req.session.pmail = email;
    res.redirect("/OTP");
  } catch (error) {
    console.log(error);
  }
};

const newOTP = async (req, res) => {
  res.render("otp", { email: req.session.pmail });
};


const securePassword = async (pass) => {
  try {
    pass = pass.trim()
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
      res.render("otp", { msg: `Provide values for email ${email} and OTP ${otp}` , email: req.session.pmail , valid:req.cookies.token});
      return
    }

    const matchedRecord = await otpModel.OTP.findOne({ email: email});
    if (!matchedRecord) {
      delete req.session.OTPId;
      res.render("otp", { msg: "No OTP found for the provided email." , email: req.session.pmail, valid:req.cookies.token});
      return
    }

    if (matchedRecord.expiresAt < Date.now()) {
      await otpModel.OTP.deleteOne({ email });
      res.render("otp", { msg: "OTP code has expired. Request a new one." , email: req.session.pmail, valid:req.cookies.token});
      return
    }

    const data = await userModels.User.findOne({ email: email });
    const token = await securePassword(data._id.toString()); // Await here

    req.session.token = token;
    res.cookie("token", token.toString(), {
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const user = await userModels.User.updateOne(
      { email: email },
      { $set: { token: token } },
      { upsert: true }
    );

    // Delete OTP record and session variable after setting the token and cookie
    await otpModel.OTP.deleteOne({ email: email });
    delete req.session.OTPId;

    // Redirect to home after cleanup
    res.redirect("/home");
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

const userLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.clearCookie("token");
        res.redirect("/login");
      }
    });
  } catch (error) {
    console.log("Error in userLogout:", error.message);
    res.status(500).send("Internal Server Error");
  }
};


// ! homepage controller

const loadHome = async (req, res) => {
  try {
    const products= await userModels.Product.find()
    res.render("home", { products, valid:req.cookies.token });
    
  } catch (error) {
    console.error("Error in loadHome:", error);
    res.status(500).send("Internal Server Error");
  }
};

const laodProductDetials = async (req, res) => {
  try {
    const id = req.query.id;

    const product = await userModels.Product
      .findById(id)
      .populate({
        path: 'categoryid',
        model: 'Category',
        select: 'name description img'
      });
    
    if (product && product.categoryid) {
      const categoryId = product.categoryid._id;
    
      const relatedProducts = await userModels.Product.find({ categoryid: categoryId });
    
      res.render("product-detail", { product, relatedProducts , valid:req.cookies.token});
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error("Error in loadProductDetails:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadProducts =  async (req,res)=>{
  try {
    const products= await userModels.Product.find()
    res.render("product", { products, valid:req.cookies.token});
    
  } catch (error) {
    console.error("Error in loadHome:", error);
    res.status(500).send("Internal Server Error");
  }
}

const loadAbout = async(req,res)=>{
  try {
    res.render("about",{ valid:req.cookies.token})
  } catch (error) {
    
  }
}
const loadContact = async(req,res)=>{
  try {
    res.render("contact",{ valid:req.cookies.token})

  } catch (error) {
    
  }
}
const loadCart = async(req,res)=>{
  try {
    res.render("cart",{ valid:req.cookies.token})

  } catch (error) {
    
  }
}
const loadBlog = async(req,res)=>{
  try {
    res.render("blog",{ valid:req.cookies.token})

  } catch (error) {
    
  }
}

module.exports = {
  loadHome,
  loadLogin,
  checkLogin,
  loadRegister,
  checkRegister,
  securePassword,
  loadOTP,
  verifyOTP,
  newOTP,
  userLogout,
  laodProductDetials,
  loadProducts,
  loadAbout,
  loadBlog,
  loadCart,
  loadContact
};
