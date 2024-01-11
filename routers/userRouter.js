const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const nocache = require("nocache");
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
const cookieParser = require("cookie-parser");
const {
  redirectLogin,
  OTPStatus,
  checkBlocke,
  checkAuthPages
} = require("../middlewares/userAuth");

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

userRoute.get("/", checkAuthPages, userController.loadLogin);
userRoute.get("/login", checkAuthPages, userController.loadLogin);
userRoute.post("/login", userController.checkLogin);

userRoute.get("/verifyOTP", checkAuthPages, OTPStatus,userController.loadOTP);
userRoute.get("/OTP", checkAuthPages, OTPStatus, userController.newOTP);
userRoute.post("/verifyOTP", userController.verifyOTP);

userRoute.get("/register", checkAuthPages, userController.loadRegister);
userRoute.post("/register", userController.checkRegister);

userRoute.get("/home", checkBlocke, redirectLogin, userController.loadHome);

userRoute.get("/about", checkBlocke, redirectLogin, (req, res) => {
  res.render("about");
});
userRoute.get("/products", checkBlocke, redirectLogin, (req, res) => {
  res.render("product");
});
userRoute.get("/product-detials", checkBlocke, redirectLogin, (req, res) => {
  res.render("product-detial");
});
userRoute.get("/cart", checkBlocke, redirectLogin, (req, res) => {
  res.render("cart");
});
userRoute.get("/blog", checkBlocke, redirectLogin, (req, res) => {
  res.render("blog");
});
userRoute.get("/contact", checkBlocke, redirectLogin, (req, res) => {
  res.render("contact");
});
userRoute.get("/whishlist", checkBlocke, redirectLogin, (req, res) => {
  res.render("cart");
});

userRoute.get("/logout", checkBlocke, redirectLogin, userController.userLogout);

module.exports = userRoute;
