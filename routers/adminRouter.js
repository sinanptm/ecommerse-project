const express = require("express");
const adminRoute = express();
const path = require("path");
const upload = require("../util/multer");
const { loadLogin, checkLogin, newOTP, loadOTP, verifyOTP, loadUser, userBlock, userUnblock, addUser, logout } = require("../controllers/adminController");
const { is_loginRequired, is_admin, is_registered } = require("../middlewares/auth");
const { loadDashBoard, loadProducts, loadAddProduct, addProduct, editProduct, loadEditProduct, deleteProduct,  listProduct, unlistProduct, laodCatagorie, addCatagorie, deleteCatogory,  editCatogory } = require("../controllers/productController");


adminRoute.set("views", path.join(__dirname, "../views/admin_pages"));
adminRoute.use(express.static(path.join(__dirname, "../public/assets")));
adminRoute.locals.title = "TRENDS DASHBOARD";

// Admin login
adminRoute.get("/", is_loginRequired, loadLogin);
adminRoute.get("/login", is_loginRequired, loadLogin);
adminRoute.post("/login", checkLogin);

// Admin OTP
adminRoute.get("/verifyOTP", is_registered, newOTP);
adminRoute.get("/verifyAdmin", is_registered, is_loginRequired, loadOTP);
adminRoute.post("/verifyAdmin", verifyOTP);

// User Management
adminRoute.get("/users", is_admin, loadUser);
adminRoute.get("/userblock/:id", is_admin, userBlock);
adminRoute.get("/userUnblock/:id", is_admin, userUnblock);
adminRoute.post("/addUser", is_admin, addUser);
adminRoute.get("/dashboard", is_admin, loadDashBoard);
adminRoute.get("/logout", is_admin, logout);

// Product Management
adminRoute.get("/productDetials", is_admin, loadProducts);
adminRoute.get("/products", is_admin, loadProducts);
adminRoute.get("/addProduct", is_admin, loadAddProduct);
adminRoute.post('/addProduct', is_admin, upload.array('image', 3), addProduct);
adminRoute.post('/editProduct/:id', is_admin, upload.array('image', 3), editProduct);
adminRoute.get("/editProduct", is_admin, loadEditProduct);
adminRoute.get("/deleteProduct/:id", is_admin, deleteProduct);

// Listing/Unlisting product
adminRoute.get("/list", is_admin, listProduct);
adminRoute.get("/unlist", is_admin, unlistProduct);

// Category Management
adminRoute.get("/catogories", is_admin, laodCatagorie);
adminRoute.post("/catogories", upload.single("file"), is_admin, addCatagorie);
adminRoute.post("/editCatogories/:id", upload.single("file"), is_admin, editCatogory);
adminRoute.get("/deleteCatogory/:id", is_admin, deleteCatogory);

module.exports = adminRoute;
