const { User } = require("../models/userModels");

const is_registered = async (req, res, next) => {
    if (req.session.OTPId) {
        next();
    } else {
        res.redirect("/register");
    }
};

const is_loginRequired = async (req, res, next) => {
    try {
        if (!req.session.token && !req.cookies.token) {
            req.session.originalUrl = req.originalUrl;
            next();
        } else {
            const user = await User.findOne({ token: req.cookies.token });
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
        res.status(500).send("Internal Server Error");
    }
};


const requireLogin = async (req, res, next) => {
    try {
        if (req.session.token || req.cookies.token) {
            const token = req.cookies.token;
            const user = await User.findOne({ token });
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
    }
};


module.exports = {
    is_registered,
    is_loginRequired,
    requireLogin,
};
