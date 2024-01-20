const express = require("express");
const userRoute = express();
const authController = require("../controllers/userController");
const pageController = require("../controllers/userPageController")
const { is_registered, requireLogin, is_loginRequired } = require("../middlewares/userAuth");
const path = require("path");



userRoute.set("views", path.join(__dirname, "../views/user_pages"));
userRoute.use(express.static(path.join(__dirname, "../public")));
userRoute.locals.title = "TRENDS";



// ! Authentication Routes

userRoute.get("/", pageController.loadHome);
userRoute.get("/login", is_loginRequired, authController.loadLogin);
userRoute.post("/login", authController.checkLogin);

userRoute.get("/sendreset", authController.loadresetmail)
userRoute.post("/sendreset", authController.sendresetmail)

userRoute.get("/resetpassword", authController.loadnewPassword)
userRoute.post("/newPassword", authController.checkNewPassword)

userRoute.get("/verifyOTP", is_loginRequired, is_registered, authController.loadOTP);
userRoute.get("/OTP", is_loginRequired, is_registered, authController.newOTP);
userRoute.post("/checkOTP", authController.verifyOTP);

userRoute.get("/register", is_loginRequired, authController.loadRegister);
userRoute.post("/register", authController.checkRegister);

// ! Page Routes

userRoute.get("/home", pageController.loadHome);
userRoute.get("/products", pageController.loadProducts);
userRoute.get("/product", pageController.laodProductDetials);

userRoute.get("/about", pageController.loadAbout);

userRoute.get("/cart", requireLogin, pageController.loadCart);
userRoute.get("/blog", pageController.loadBlog);
userRoute.get("/contact", pageController.loadContact);
userRoute.get("/whishlist", pageController.loadCart);

userRoute.get("/logout", authController.userLogout);

module.exports = userRoute;
