const express = require("express");
const userRoute = express();
const authController = require("../controllers/userController");
const pageController = require("../controllers/userPageController")
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

userRoute.set("view engine", "ejs");
userRoute.set("views", path.join(__dirname, "../views/user_pages"));
userRoute.use(express.static(path.join(__dirname, "../public")));
userRoute.use(nocache());
userRoute.use(cookieParser());
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));
userRoute.locals.title = "TRENDS";
userRoute.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
  })
);

// ! Authentication Routes
userRoute.get('/clear-sessions', (req, res) => {
  // Clear all cookies
  const cookies = Object.keys(req.cookies);
  cookies.forEach(cookieName => {
    res.clearCookie(cookieName);
  });

  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      // Redirect to home page or login page after clearing cookies and session
      res.redirect('/');
    }
  });
});
userRoute.get("/", pageController.loadHome);
userRoute.get("/login", checkAuthPages, authController.loadLogin);
userRoute.post("/login", authController.checkLogin);

userRoute.get("/sendreset", authController.loadresetmail)
userRoute.post("/sendreset", authController.sendresetmail)

userRoute.get("/resetpassword", authController.loadnewPassword)
userRoute.post("/newPassword", authController.checkNewPassword)

userRoute.get("/verifyOTP", checkAuthPages, OTPStatus, authController.loadOTP);
userRoute.get("/OTP", checkAuthPages, OTPStatus, authController.newOTP);
userRoute.post("/checkOTP", authController.verifyOTP);

userRoute.get("/register", checkAuthPages, authController.loadRegister);
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
