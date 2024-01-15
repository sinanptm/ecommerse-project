const express = require("express");
const adminRoute = express();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController")
const nocache = require("nocache");
const fs = require("fs")
const path = require("path");
const session = require("express-session");
const { secret } = require("../config/lock");
const cookieParser = require("cookie-parser");
const { checkStatus, redirectLogin, OTPStatus } = require("../middlewares/auth");
const flash = require('express-flash');
const multer = require("multer");
const { error } = require("console");
const { ifError } = require("assert");


adminRoute.set("view engine", "ejs");
adminRoute.set("views", path.join(__dirname, "../views/admin_pages"));
adminRoute.use(express.static(path.join(__dirname, "../public/assets")));
adminRoute.locals.title = "TRENDS DASHBOARD";

adminRoute.use(flash());
adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));
adminRoute.use(cookieParser());
adminRoute.use(session({ secret: secret, resave: false, saveUninitialized: true }));
adminRoute.use(flash());
adminRoute.use(nocache());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,"../public/product_images"));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });



// ! admin login
adminRoute.get("/", checkStatus, adminController.loadLogin);
adminRoute.get("/login", checkStatus, adminController.loadLogin);
adminRoute.post("/login", adminController.checkLogin);

// ! admin otp
adminRoute.get("/verifyOTP", OTPStatus, adminController.newOTP);
adminRoute.get("/verifyAdmin", OTPStatus, checkStatus, adminController.loadOTP);
adminRoute.post("/verifyAdmin", adminController.verifyOTP);

// ! user Managment 
adminRoute.get("/users", redirectLogin, adminController.loadUser)

adminRoute.get('/userblock/:id', redirectLogin,  adminController.userBlock);
adminRoute.get('/userUnblock/:id', redirectLogin,  adminController.userUnblock);

adminRoute.post("/addUser", redirectLogin, adminController.addUser)

adminRoute.get("/dashboard", redirectLogin, productController.loadDashBoard);

adminRoute.get("/logout", redirectLogin, adminController.logout)


// ! poduct management
adminRoute.get("/productDetials", redirectLogin, productController.loadProducts);
adminRoute.get("/products", redirectLogin, productController.loadProducts);

adminRoute.get("/addProduct", redirectLogin, productController.loadAddProduct)
adminRoute.post('/addProduct',  redirectLogin, upload.array('image', 3), productController.addProduct);

adminRoute.post('/editProduct/:id', redirectLogin,upload.array('image', 3), productController.editProduct)
adminRoute.get("/editProduct",  redirectLogin, productController.loadEditProduct);
adminRoute.get("/deleteProduct/:id", redirectLogin, productController.deleteProduct)

// ! qatogory managment
adminRoute.get("/catogories", redirectLogin, productController.laodCatagorie);
adminRoute.post("/catogories",  upload.single("file"), redirectLogin, productController.addCatagorie);
adminRoute.post("/editCatogories/:id", upload.single("file"), redirectLogin, productController.editCatogory);
adminRoute.get("/deleteCatogory/:id", redirectLogin, productController.deleteCatogory)

module.exports =  adminRoute ;

