const redirectLogin = async (req, res, next) => {
  try {
    if (req.session.token && req.cookies.token) {
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

const checkStatus = async (req, res, next) => {
  try {
    if (req.session.token && req.cookies.token) {
      res.redirect("/home");
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
