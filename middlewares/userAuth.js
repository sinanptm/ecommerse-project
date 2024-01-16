const userModels = require("../models/userModels");

const OTPStatus = async (req, res, next) => {
    if (req.session.OTPId) {
        next();
    } else {
        res.redirect("/login");
    }
};

const checkAuthPages = (req, res, next) => {
    try {
        if (!req.session.token && !req.cookies.token) {
            next();
        } else {
            res.redirect("/home");
        }
    } catch (err) {
        console.error(
            "Error checking authentication for login and signup pages:",
            err.message
        );
        res.status(500).send("Internal Server Error");
    }
};
const requireLogin = async (req, res, next) => {
    try {
        if (req.session.token || req.cookies.token) {
            // User is logged in
            const token = req.cookies.token;
            const user = await userModels.User.findOne({ token });
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
            // User is not logged in
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
    OTPStatus,
    checkAuthPages,
    requireLogin,
};
