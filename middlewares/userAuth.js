const { User, Cart, Wishlist } = require("../models/userModels");
const { Message, Banner } = require("../models/productModel");
const { getUserIdFromToken } = require("../util/validations");


const is_registered = async (req, res, next) => {
    try {
        if (req.session.OTPId) {
            next();
        } else {
            res.redirect("/register");
        }
    } catch (error) {
        res.status(304).redirect('/')
        console.log('error in is_registered', error.message);
    }
};

const is_loginRequired = async (req, res, next) => {
    try {
        if (!req.session.token && !req.cookies.token) {
            req.session.originalUrl = req.originalUrl;
            next();
        } else {
            const token = await getUserIdFromToken(req.cookies.token || req.session.token);
            const user = await User.findOne({ _id: token });
            if (!user) {
                next();
            } else {
                const redirectUrl = req.session.originalUrl || "/";
                delete req.session.originalUrl;
                res.redirect(redirectUrl);
            }
        }
    } catch (err) {
        console.error("Error checking authentication for login and signup pages:", err.message);
        res.status(304).redirect('/')
    }
};


const requireLogin = async (req, res, next) => {
    try {
        if (req.session.token || req.cookies.token) {
            const token = await getUserIdFromToken(req.session.token || req.cookies.token)
            const user = await User.findOne({ _id: token });
            if (!user) {
                return res.redirect('/login')
            }
            if (user.status === "Blocked") {
                req.session.destroy((err) => {
                    if (err) {
                        console.error("Error destroying session:", err);
                    }
                    res.clearCookie("token");
                    res.redirect("/login");
                });
            } else {
                res.locals.loginRequired = false;
                res.locals.loginMessage = "You need to be logged in to access this page.";
                next();
            }
        } else {
            res.locals.loginRequired = true;
            res.locals.loginMessage = "You need to be logged in to access this page.";
            next();
        }
    } catch (err) {
        console.log("Error checking login status:", err.message);
        req.session.destroy()
        req.clearCookie("token")
        res.status(304).redirect('/')
    }
};

const notifications = async (req, res, next) => {
    try {
        res.locals.title = "TRENDS"
        const banner = await Banner.findOne()
        res.locals.banner = banner
        if (req.cookies.token || req.session.token) {
            const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
            const cart = await Cart.findOne({ userId })
            let whish = await Wishlist.findOne({ userid: userId }).lean()
            if (whish && whish.products) {
                whish.products = new Set(whish.products);
                var productIds = Array.from(whish.products).map(objId => objId.toString());
            }
            const msg = await Message.find({ userId, status: "resolved" })

            res.locals.whishItems = productIds ? productIds.length : 0
            res.locals.messages = msg ? msg.length : 0
            res.locals.cartItems = cart ? cart.items || 0 : 0;
            res.locals.valid = req.cookies.token || req.session.token;
            next();
        } else {
            res.locals.cartItems = 0;
            res.locals.messages = 0
            res.locals.whishItems = 0;
            res.locals.valid = req.cookies.token || req.session.token;
            next();
        }
    } catch (error) {
        res.locals.cartItems = 0;
        res.locals.messages = 0
        res.locals.whishItems = 0;
        res.locals.valid = req.cookies.token || req.session.token;
        next();
        console.log("error in laoding notification :", error.message);
    }
}


const handleUndefinedRoutes = (req, res, next) => {
    res.status(404).render('error', { msg: 'Page not found', toast: "This page not found", title: `404` });
}




module.exports = {
    is_registered,
    is_loginRequired,
    requireLogin,
    notifications,
    handleUndefinedRoutes
};
