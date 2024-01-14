const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const nocache = require("nocache");
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
const cookieParser = require("cookie-parser");
const {
  OTPStatus,
  requireLogin,
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

userRoute.get("/verifyOTP", checkAuthPages, OTPStatus, userController.loadOTP);
userRoute.get("/OTP", checkAuthPages, OTPStatus, userController.newOTP);
userRoute.post("/checkOTP", userController.verifyOTP);

userRoute.get("/register", checkAuthPages, userController.loadRegister);
userRoute.post("/register", userController.checkRegister);

userRoute.get("/home", userController.loadHome);
userRoute.get("/products", userController.loadProducts);
userRoute.get("/product", userController.laodProductDetials);


userRoute.get("/about", userController.loadAbout);

userRoute.get("/cart", requireLogin, userController.loadCart);
userRoute.get("/blog", userController.loadBlog);
userRoute.get("/contact", userController.loadContact);
userRoute.get("/whishlist", userController.loadCart);

userRoute.get("/logout", userController.userLogout);

module.exports = userRoute;
