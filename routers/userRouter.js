const { path, express } = require("../util/modules")
const userRoute = express();
const { loadLogin, checkLogin, loadresetmail, sendresetmail, loadnewPassword, checkNewPassword, loadOTP, newOTP, verifyOTP, loadRegister, checkRegister, userLogout, } = require("../controllers/user/loginController");
const { loadHome, loadProducts, laodProductDetials, loadAccount, editDetails, edittAddress, addAddress, deleteAddress, loadAbout, loadContact, cancelOrder, changePassword, createInvoice, contactAdmin, markAsRead, returnOrder } = require("../controllers/user/userPageController");
const { loadCart, addToCart, addQuantity, removeProduct, loadCheckout, addToCheckout, online_payment, placeOrder, showSuccess, addToCartProductPage, loadWhishList, addToWhishlist, removeFromWhishlist } = require("../controllers/user/cartController")
const { is_registered, requireLogin, is_loginRequired, notifications, handleUndefinedRoutes } = require("../middlewares/userAuth");

userRoute.set("views", path.join(__dirname, "../views/user_pages"));
userRoute.use(express.static(path.join(__dirname, "../public")));
userRoute.use(notifications);


userRoute.get("/login", is_loginRequired, loadLogin);
userRoute.post("/login", is_loginRequired, checkLogin);

userRoute.get("/sendreset", loadresetmail);
userRoute.post("/sendreset", sendresetmail);
userRoute.get("/resetpassword", loadnewPassword);
userRoute.post("/newPassword", checkNewPassword);

userRoute.get("/verifyOTP", is_loginRequired, is_registered, loadOTP);
userRoute.get("/OTP", is_loginRequired, is_registered, newOTP);
userRoute.post("/checkOTP", verifyOTP);

userRoute.get("/register", is_loginRequired, loadRegister);
userRoute.post("/register", is_loginRequired, checkRegister);

// * home page and products page
userRoute.get("/", loadHome);
userRoute.get("/home", loadHome);
userRoute.get("/products", loadProducts);
userRoute.get("/product", laodProductDetials);

userRoute.get("/about", loadAbout);

// * for constacting customer serviece  

userRoute.get("/contact", loadContact);
userRoute.post('/contact-admin', contactAdmin)
userRoute.get("/mark-as-read/:id", markAsRead)

// * for validating the credentials 
userRoute.use(requireLogin)

// * Cart managment 
userRoute.get("/cart", loadCart);
userRoute.post("/add-to-cart", addToCart);
userRoute.post('/quantity-manage/:id', addQuantity);
userRoute.delete('/removeProduct/:id', removeProduct);
userRoute.get("/addtocart", addToCartProductPage);

// * checkout routes 
userRoute.post('/to-checkout', addToCheckout);
userRoute.get('/checkout', loadCheckout);
userRoute.post("/place-order", placeOrder);
userRoute.post("/online-payment", online_payment);
userRoute.get('/order-success', showSuccess);
userRoute.get("/logout", userLogout);

// * User Profile Routes
userRoute.get('/account', loadAccount);
userRoute.post('/create-invoice', createInvoice);
userRoute.put('/edit-details', editDetails);
userRoute.post("/change-password", changePassword);
userRoute.post('/add-address', addAddress);
userRoute.put('/edit-address/:id', edittAddress);
userRoute.delete('/delete-address/:id', deleteAddress);

userRoute.post('/cancel-order', cancelOrder);
userRoute.delete("/return-order", returnOrder);

// * Whish list managment 
userRoute.get("/whishlist", loadWhishList);
userRoute.get('/add-to-whishlist', addToWhishlist);
userRoute.get('/remove-from-whishlist', removeFromWhishlist);

// * for undifined request managment 
userRoute.use(handleUndefinedRoutes);

module.exports = userRoute;