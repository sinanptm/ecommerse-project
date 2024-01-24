const { User, Cart } = require("../models/userModels");
const { getUserIdFromToken } = require("../util/bcryption")

const has_token = async (req,res,next)=>{
    try {
        if (req.session.token || req.cookies.token) {
            const token = await getUserIdFromToken(req.cookies.token || req.session.token);
            const user = await User.findOne({ _id:token });
            if (!user) {
                req.session.destroy();
                req.clearCookie("token")
            }
            next()
        }
        
    } catch (error) {
        console.log('error in credential check:',error.message);
        next()
    }
} 

const is_registered = async (req, res, next) => {
    try {
        if (req.session.OTPId) {
            next();
        } else {
            res.redirect("/register");
        }
    } catch (error) {
        res.redirect("/home")
        console.log('error in is_registered',error.message);
    }
};

const is_loginRequired = async (req, res, next) => {
    try {
        if (!req.session.token && !req.cookies.token) {
            req.session.originalUrl = req.originalUrl;
            next();
        } else {
            const token = await getUserIdFromToken(req.cookies.token || req.session.token);
            const user = await User.findOne({ _id:token });
            if (!user) {
                console.log(user);
                next();
            } else {
                const redirectUrl = req.session.originalUrl || "/";
                delete req.session.originalUrl;
                res.redirect(redirectUrl);
            }
        }
    } catch (err) {
        console.error("Error checking authentication for login and signup pages:", err.message);
        res.status(500).send("Internal Server Error");
    }
};


const requireLogin = async (req, res, next) => {
    try {
        if (req.session.token || req.cookies.token) {
            const token = await getUserIdFromToken( req.cookies.token)
            const user = await User.findOne({ _id:token });
            if (!user) {
                return res.status(401).send("Unauthorized");
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
        res.status(500).send("Internal Server Error");
        req.session.destroy()
        req.clearCookie("token")
        res.redirect("/home")
    }
};

const cartItems = async (req, res, next) => {
    try {
        if (req.cookies.token || req.session.token) {
            const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
            const cart = await Cart.findOne({ userId })
            res.locals.cartItems = cart ? cart.items || 0 : 0;
            res.locals.valid = req.cookies.token || req.session.token
            next();
        } else {
            res.locals.cartItems = 0;
            res.locals.valid = req.cookies.token || req.session.token
            next();
        }
    } catch (error) {
        res.locals.cartItems = 0;
        res.locals.valid = req.cookies.token || req.session.token
        next();
        console.log("Invalid Credentials:",error.message);
    }
}


module.exports = {
    is_registered,
    is_loginRequired,
    requireLogin,
    cartItems,
    has_token
};
