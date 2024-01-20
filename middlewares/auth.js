const { Admin } = require("../models/userModels");

const is_admin = async (req, res, next) => {
  try {
    if (req.session.adminToken || req.cookies.adminToken) {
      const token = req.cookies.adminToken
      const admin = await Admin.findOne({ token })
      if (!admin) {
        res.redirect("/admin/login");
      } else {
        next();  
      }
    } else {
      res.redirect("/admin/login");
    }
  } catch (err) {
    console.log("Error checking login status:", err.message);
    res.status(500).redirect('/admin/login')
  }
};

const is_registered = async (req, res, next) => {
  if (req.session.OTPId) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

const is_loginRequired = async (req, res, next) => {
  try {
    if (req.session.adminToken || req.cookies.adminToken) {
      const token = req.session.adminToken || req.cookies.adminToken;
      const admin = await Admin.findOne({ token });
      if (!admin) {
        next();
      } else {
        const redirectUrl = req.session.originalUrl || "/admin/dashboard";
        delete req.session.originalUrl;
        return res.redirect(redirectUrl);
      }
    } else {
      next();
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).next()
  }
};

module.exports = {
  is_loginRequired,
  is_admin,
  is_registered,
};
