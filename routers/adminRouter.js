const express = require("express");
const adminRoute = express();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController")
const nocache = require("nocache");
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
const cookieParser = require("cookie-parser");
const { checkStatus, redirectLogin, OTPStatus } = require("../middlewares/auth");
const flash = require('express-flash');

adminRoute.use(nocache());
adminRoute.use(cookieParser());
adminRoute.set("view engine", "ejs");
adminRoute.set("views", path.join(__dirname, "../views/admin_pages"));
adminRoute.use(express.static(path.join(__dirname, "../public/assets")));
adminRoute.locals.title = "TRENDS DASHBOARD";
adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));
adminRoute.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
  })
);
adminRoute.use(flash());


// ! admin login
adminRoute.get("/", checkStatus, adminController.loadLogin);
adminRoute.get("/login", checkStatus, adminController.loadLogin);
adminRoute.post("/login", adminController.checkLogin);

// ! admin otp
adminRoute.get("/verifyOTP", OTPStatus, adminController.newOTP);
adminRoute.get("/verifyAdmin", OTPStatus, checkStatus, adminController.loadOTP);
adminRoute.post("/verifyAdmin", adminController.verifyOTP);

// ! userManagment 
adminRoute.get("/users",adminController.loadUser)

adminRoute.get('/userdetails', adminController.userDetails);

adminRoute.get('/userblock/:id', adminController.userBlock);
adminRoute.get('/userUnblock/:id', adminController.userUnBlock);
adminRoute.get('/userdelete/:id', adminController.userDelete);

adminRoute.post("/addUser",adminController.addUser)
adminRoute.post('/useredit/:id', adminController.userEdit);

adminRoute.get("/dashboard",productController.loadDashBoard);

adminRoute.get("/productDetials",productController.loadProducts);
adminRoute.get("/products",productController.loadProducts);

adminRoute.get("/catogories",productController.laodCatagorie);
adminRoute.post("/catogories",productController.addCatagorie);
adminRoute.post("/editCatogories/:id",productController.editCatogory);
adminRoute.get("/deleteCatogory/:id",productController.deleteCatogory)

// adminRoute.get("/brands");
// adminRoute.get("/orders");
// adminRoute.get("/orderDetials");
// adminRoute.get("/transactions");

module.exports =  adminRoute ;
