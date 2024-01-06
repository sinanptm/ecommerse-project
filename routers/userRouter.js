const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController");
const nocache = require("nocache");
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
userRoute.use(nocache());

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

userRoute.get("/", userController.loadLogin);
userRoute.get("/login", userController.loadLogin);
userRoute.post("/login", userController.checkLogin);

userRoute.get("/verifyOTP", userController.loadOTP);
userRoute.post("/verifyOTP", userController.verifyOTP);

userRoute.get("/register", userController.loadRegister);
userRoute.post("/register", userController.checkRegister);

userRoute.get("/home", userController.loadHome);

userRoute.get("/about", (req, res) => {
  res.render("about");
});
userRoute.get("/products", (req, res) => {
  res.render("product");
});
userRoute.get("/product-detials", (req, res) => {
  res.render("product-detial");
});
userRoute.get("/cart", (req, res) => {
  res.render("cart");
});
userRoute.get("/blog", (req, res) => {
  res.render("blog");
});
userRoute.get("/contact", (req, res) => {
  res.render("contact");
});
userRoute.get("/whishlist", (req, res) => {
  res.render("cart");
});

module.exports = userRoute;
