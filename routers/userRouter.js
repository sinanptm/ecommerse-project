const { path, express } = require("../util/modules")
const userRoute = express();
const { loadLogin, checkLogin, loadresetmail, sendresetmail, loadnewPassword, checkNewPassword, loadOTP, newOTP, verifyOTP, loadRegister, checkRegister, userLogout, } = require("../controllers/user/userController");
const { loadHome, loadProducts, laodProductDetials, loadAccount, editDetails, edittAddress, addAddress, deleteAddress, loadAbout, loadBlog, loadContact, loadEror, cancelOrder, changePassword, createInvoice } = require("../controllers/user/userPageController");
const { loadCart, addToCart, addQuantity, removeProduct, loadCheckout, addToCheckout, online_payment, placeOrder, showSuccess, addToCartProductPage, loadWhishList, addToWhishlist, removeFromWhishlist } = require("../controllers/user/cartController")
const { is_registered, requireLogin, is_loginRequired, cartItems, handleUndefinedRoutes } = require("../middlewares/userAuth");

userRoute.set("views", path.join(__dirname, "../views/user_pages"));
userRoute.use(express.static(path.join(__dirname, "../public")));
userRoute.use(cartItems);

userRoute.get("/", loadHome);
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


// * User Profile Routes
userRoute.get('/account', requireLogin, loadAccount)
userRoute.post('/create-invoice', createInvoice)
userRoute.put('/edit-details', requireLogin, editDetails);
userRoute.post("/change-password", requireLogin, changePassword)
userRoute.post('/add-address', requireLogin, addAddress)
userRoute.put('/edit-address/:id', requireLogin, edittAddress)
userRoute.delete('/delete-address/:id', requireLogin, deleteAddress);
userRoute.post('/cancel-order', requireLogin, cancelOrder)

userRoute.get("/home", loadHome);
userRoute.get("/products", loadProducts);
userRoute.get("/product", laodProductDetials);

// * Cart Routes
userRoute.get("/cart", requireLogin, loadCart);
userRoute.post("/add-to-cart", requireLogin, addToCart)
userRoute.post('/quantity-manage/:id', requireLogin, addQuantity)
userRoute.delete('/removeProduct/:id', requireLogin, removeProduct)
userRoute.get("/addtocart", addToCartProductPage)

// * Whishlist routes 

userRoute.get("/whishlist", requireLogin, loadWhishList);
userRoute.get('/add-to-whishlist', requireLogin, addToWhishlist);
userRoute.get('/remove-from-whishlist', requireLogin, removeFromWhishlist);


// * checkout routes 
userRoute.post('/to-checkout', requireLogin, addToCheckout)
userRoute.get('/checkout', requireLogin, loadCheckout)
userRoute.post("/place-order", requireLogin, placeOrder)
userRoute.post("/online-payment", requireLogin, online_payment)
userRoute.get('/order-success', requireLogin, showSuccess)



userRoute.get("/about", loadAbout);
userRoute.get("/blog", loadBlog);
userRoute.get("/contact", loadContact);

userRoute.get('/error-page', loadEror)
userRoute.get("/logout", userLogout);

userRoute.use(handleUndefinedRoutes);





module.exports = userRoute;


// userRoute.get('/clear-session', (req, res) => {
//     // Clear all cookies
//     const cookies = Object.keys(req.cookies);
//     cookies.forEach(cookie ,i=> {
//         console.log("Cleared Cokiee: ",i ,cookie);
//         res.clearCookie(cookie);
//     });

//     // Clear session data
//     req.session.destroy((err) => {
//         if (err) {
//             console.error('Error clearing session:', err);
//             res.status(500).send('Error clearing session');
//         } else {
//             console.log('Session cleared successfully');
//             res.redirect('/'); // Redirect to home page or any other page
//         }
//     });
// });