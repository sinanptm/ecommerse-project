const { path, express } = require("../util/modules");
const adminRoute = express();
const { upload, banner } = require("../util/multer");
const { loadLogin, checkLogin, loadUser, userBlock, userUnblock, logout, loadMessages, sendReply, loadBanners, editBanner, addHomeBanner, deleteBanner } = require("../controllers/admin/userControlller");
const { loadDashBoard, loadOrders, deleteOrder, editOrder, loadOrder,getSalesReport, loadCoupons, addCoupon, deleteCoupon, editCoupon } = require("../controllers/admin/orderController");
const { loadProducts, loadAddProduct, addProduct, editProduct, loadEditProduct, deleteProduct, listProduct, unlistProduct } = require("../controllers/admin/products");
const {laodCatagorie, addCatagorie, deleteCatogory, editCatogory } = require("../controllers/admin/category");
const { is_loginRequired, is_admin, handleUndefinedRoutes } = require("../middlewares/adminAuth");



adminRoute.set("views", path.join(__dirname, "../views/admin_pages"));
adminRoute.use(express.static(path.join(__dirname, "../public/assets")));
adminRoute.locals.title = "TRENDS DASHBOARD";
adminRoute.use('/user-public', express.static(path.join(__dirname, "../public")));


// * Admin login
adminRoute.get("/", is_loginRequired, loadLogin);
adminRoute.get("/login", is_loginRequired, loadLogin);
adminRoute.post("/login", checkLogin);

//! Admin OTP
// * adminRoute.get("/verifyOTP", is_registered, newOTP);
// * adminRoute.get("/verifyAdmin", is_registered, is_loginRequired, loadOTP);
// * adminRoute.post("/verifyAdmin", verifyOTP);


// * For Validating Admin Token
adminRoute.use(is_admin)

adminRoute.get("/dashboard", loadDashBoard);
adminRoute.post("/get-report-pdf/:type", getSalesReport)

// * User Management
adminRoute.get("/users", loadUser);
adminRoute.get("/userblock/:id", userBlock);
adminRoute.get("/userUnblock/:id", userUnblock);
adminRoute.get("/logout", logout);


// * Product Management
adminRoute.get("/productDetials", loadProducts);
adminRoute.get("/products", loadProducts);
adminRoute.get("/addProduct", loadAddProduct);
adminRoute.post('/addProduct', upload.array('image', 3), addProduct);
adminRoute.post('/editProduct/:id', upload.array('image', 3), editProduct);
adminRoute.get("/editProduct", loadEditProduct);
adminRoute.get("/deleteProduct/:id", deleteProduct);

// * Listing/Unlisting product
adminRoute.get("/list", listProduct);
adminRoute.get("/unlist", unlistProduct);

// * Category Management
adminRoute.get("/catogories", laodCatagorie);
adminRoute.post("/catogories", upload.single("file"), addCatagorie);
adminRoute.post("/editCategories/:id", upload.single("file"), editCatogory);
adminRoute.get("/deleteCatogory/:id", deleteCatogory);

// * Coupn managment 
adminRoute.get('/coupon-managment', loadCoupons);
adminRoute.post('/add-coupon', addCoupon);
adminRoute.delete("/delete-coupon", deleteCoupon);
adminRoute.post("/edit-coupon", editCoupon);

// * Banner managment
adminRoute.get("/banner-managment", loadBanners);
adminRoute.put("/edit-banner/:page", banner.single("file"), editBanner);
adminRoute.post("/add-home-banner", banner.single('file'), addHomeBanner);
adminRoute.delete("/delete-banner/:index", deleteBanner);

// * Orders managment
adminRoute.get("/orders-list", loadOrders);
adminRoute.get('/order-details', loadOrder);
adminRoute.get("/delete-order", deleteOrder);
adminRoute.post('/edit-order/:id', editOrder);

adminRoute.get("/messages", loadMessages);
adminRoute.post("/send-reply", sendReply);

adminRoute.use(handleUndefinedRoutes);

module.exports = adminRoute;
