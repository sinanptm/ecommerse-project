const express = require("express");
const adminRoute = express();
const path = require("path");
const upload = require("../util/multer");
const { loadLogin, checkLogin, loadUser, userBlock, userUnblock, logout } = require("../controllers/adminController");
const { loadDashBoard, loadProducts, loadAddProduct, addProduct, editProduct, loadEditProduct, deleteProduct, listProduct, unlistProduct, laodCatagorie, addCatagorie, deleteCatogory, editCatogory, loadOrders, deleteOrder, editOrder, loadOrder, loadReport, getSalesReport } = require("../controllers/productController");
const { is_loginRequired, is_admin, handleUndefinedRoutes } = require("../middlewares/auth");

adminRoute.set("views", path.join(__dirname, "../views/admin_pages"));
adminRoute.use(express.static(path.join(__dirname, "../public/assets")));
adminRoute.locals.title = "TRENDS DASHBOARD";


adminRoute.get('/sales-report/:type', loadReport)

// Admin login
adminRoute.get("/", is_loginRequired, loadLogin);
adminRoute.get("/login", is_loginRequired, loadLogin);
adminRoute.post("/login", checkLogin);

//! Admin OTP
// adminRoute.get("/verifyOTP", is_registered, newOTP);
// adminRoute.get("/verifyAdmin", is_registered, is_loginRequired, loadOTP);
// adminRoute.post("/verifyAdmin", verifyOTP);


adminRoute.use(is_admin)

adminRoute.get("/dashboard", loadDashBoard);
adminRoute.post("/get-report-pdf/:type", getSalesReport)

// User Management
adminRoute.get("/users", loadUser);
adminRoute.get("/userblock/:id", userBlock);
adminRoute.get("/userUnblock/:id", userUnblock);
adminRoute.get("/logout", logout);

// Product Management
adminRoute.get("/productDetials", loadProducts);
adminRoute.get("/products", loadProducts);
adminRoute.get("/addProduct", loadAddProduct);
adminRoute.post('/addProduct', upload.array('image', 3), addProduct);
adminRoute.post('/editProduct/:id', upload.array('image', 3), editProduct);
adminRoute.get("/editProduct", loadEditProduct);
adminRoute.get("/deleteProduct/:id", deleteProduct);

// Listing/Unlisting product
adminRoute.get("/list", listProduct);
adminRoute.get("/unlist", unlistProduct);

// Category Management
adminRoute.get("/catogories", laodCatagorie);
adminRoute.post("/catogories", upload.single("file"), addCatagorie);
adminRoute.post("/editCatogories/:id", upload.single("file"), editCatogory);
adminRoute.get("/deleteCatogory/:id", deleteCatogory);

adminRoute.get("/orders-list", loadOrders)
adminRoute.get('/order-details', loadOrder)
adminRoute.get("/delete-order", deleteOrder)
adminRoute.post('/edit-order/:id', editOrder)

adminRoute.use(handleUndefinedRoutes)

module.exports = adminRoute;
