const redirectLogin = async (req, res, next) => {
  try {
    if (req.session.adminToken || req.cookies.adminToken) {
      next();
    } else {
      res.redirect("/admin/login");
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
    res.redirect("/admin/login");
  }
};

const checkStatus = async (req, res, next) => {
  try {
    if (req.session.adminToken || req.cookies.adminToken) {
      res.redirect("/admin/dashboard");
    } else {
      next();
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  checkStatus,
  redirectLogin,
  OTPStatus,
  
};
