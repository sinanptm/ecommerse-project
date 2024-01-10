const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const nocache = require("nocache");
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
const cookieParser = require("cookie-parser");
const { checkStatus, redirectLogin, OTPStatus } = require("../middlewares/userAuth");

userRoute.use(nocache());
userRoute.use(cookieParser());
userRoute.set("view engine", "ejs");
userRoute.set("views", path.join(__dirname, "../views/user_pages"));
userRoute.use(express.static(path.join(__dirname, "../public")));
userRoute.locals.title = "TRENDS";
userRoute.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
  })
);

userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

userRoute.get("/", checkStatus, userController.loadLogin);
userRoute.get("/login", checkStatus, userController.loadLogin);
userRoute.post("/login", userController.checkLogin);

userRoute.get("/verifyOTP", OTPStatus, checkStatus, userController.loadOTP);
userRoute.get('/OTP',OTPStatus,userController.newOTP)
userRoute.post("/verifyOTP", userController.verifyOTP);

userRoute.get("/register", checkStatus, userController.loadRegister);
userRoute.post("/register", userController.checkRegister);

userRoute.get("/home", redirectLogin ,userController.loadHome);

userRoute.get("/about", redirectLogin,(req, res) => {
  res.render("about");
});
userRoute.get("/products", redirectLogin, (req, res) => {
  res.render("product");
});
userRoute.get("/product-detials", redirectLogin, (req, res) => {
  res.render("product-detial");
});
userRoute.get("/cart", redirectLogin, (req, res) => {
  res.render("cart");
});
userRoute.get("/blog",  redirectLogin,(req, res) => {
  res.render("blog");
});
userRoute.get("/contact", checkStatus, (req, res) => {
  res.render("contact");
});
userRoute.get("/whishlist",  redirectLogin,(req, res) => {
  res.render("cart");
});

userRoute.get("/logout",redirectLogin,userController.userLogout)

module.exports = userRoute;
