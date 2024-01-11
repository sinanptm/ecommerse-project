const userModels = require("../models/userModels");

const redirectLogin = async (req, res, next) => {
    try {
        if (req.session.token || req.cookies.token) {
            next();
        } else {
            res.redirect("/login");
        }
    } catch (err) {
        console.log("Error checking login status:", err.message);
        res.status(500).send("Internal Server Error");
    }
};

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
      console.error("Error checking authentication for login and signup pages:", err.message);
      res.status(500).send("Internal Server Error");
  }
};


const checkBlocke = async (req, res, next) => {
    try {
        const token = req.session.token;
        const user = await userModels.User.findOne({ token });
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        if (user.status === 'Blocked') {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                res.clearCookie('token');
                res.redirect('/login');
            });
        } else {
            next();
        }
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    redirectLogin,
    OTPStatus,
    checkBlocke,
    checkAuthPages
};
