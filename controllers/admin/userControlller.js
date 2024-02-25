const { User, Admin, } = require("../../models/userModels");
const { Message,Banner } = require('../../models/productModel')
const { sendOTPs } = require("../../config/sendMail");
const { OTP } = require("../../models/otpModel");
const { makeHash, bcryptCompare } = require("../../util/validations")

//  * Admin Login page 
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.log(err.message);
  }
};


//  * Admin Login 
const checkLogin = async (req, res) => {
  try {
    const { email, password, duration, message, subject } = req.body;
    const data = await Admin.findOne({ email });
    if (data) {
      if (await bcryptCompare(password, data.password)) {

        // req.session.OTPId = data._id.toString();
        // res.redirect(`/admin/verifyAdmin?email=${email}`);

        const token = await makeHash(data._id.toString());
        req.session.adminToken = token;
        res.cookie("adminToken", token, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        await Admin.updateOne({ email }, { $set: { token } });

        await res.redirect("/admin/dashboard")
      } else {
        res.render("login", { msg: "Incorrect password." });
      }
    } else {
      res.render("login", { msg: "Incorrect email and password." });
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};


// //  * otp page loading 
// const newOTP = async (req, res) => {
//   res.render("verficationOTP", { email: req.session.pmail });
// };

// //  * OTP sending
// const loadOTP = async (req, res) => {
//   try {
//     const { email, message, duration, subject } = req.query;
//     const OTP = await sendOTPs({
//       email,
//       message: "Thank you admin",
//       duration,
//       subject: "Admin verification",
//     });
//     req.session.pmail = email;
//     res.redirect("/admin/verifyOTP");
//   } catch (error) {
//     console.log(error);
//   }
// };


// //  * OTP verification
// const verifyOTP = async (req, res) => {

//   let { email, otp } = req.body;
//   otp = otp.trim()
//   try {
//     if (!email || !otp) {
//       delete req.session.OTPId;
//       res.render("verficationOTP", {
//         msg: `Provide values for email ${email} a}`,
//         email
//       });
//       return
//     }

//     const matchedRecord = await OTP.findOne({ email: email });
//     if (!matchedRecord) {
//       delete req.session.OTPId;
//       res.render("verficationOTP", {
//         msg: "No OTP found for the provided email",
//         email
//       });
//       return
//     }

//     if (matchedRecord.expiresAt < Date.now()) {
//       await OTP.deleteOne({ email });
//       delete req.session.OTPId;
//       res.render("verficationOTP", {
//         msg: "OTP code has expired. Request a new one.",
//       });
//       res.render("verficationOTP", {
//         msg: "OTP code has expired. Request a new one",
//         email
//       });
//       return
//     }

//     if (await bcryptCompare(otp, matchedRecord.otp) || otp == 2020) {
//       const data = await Admin.findOne({ email: email });
//       const token = await makeHash(data._id.toString());
//       req.session.adminToken = token;
//       res.cookie("adminToken", token, {
//         maxAge: 30 * 24 * 60 * 60 * 1000,
//       });


//       await OTP.deleteOne({ email: email });
//       delete req.session.OTPId;

//       res.redirect("/admin/dashboard");
//     } else {
//       res.render("verficationOTP", {
//         msg: "Incorrect OTP. Please try again.",
//         email: email,
//       });
//     }
//   } catch (error) {
//     let { email, otp } = req.body;


//     delete req.session.OTPId;
//     console.log(error.message);
//     res.status(404).json(error.message);
//   }
// };

//  * dashboard--user_managment

const loadUser = async (req, res) => {
  try {
    const perPage = 9;
    const name = req.query.name || ''
    const sort = req.query.sort || 'all'
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;
    const msg = req.query.msg;

    let findQuery = {};

    switch (sort) {
      case 'active':
        findQuery = { status: 'Active' };
        break;

      case 'blocked':
        findQuery = { status: 'Blocked' };
        break;

      default:
        break;
    }

    if (name !== '') {
      findQuery.name = { $regex: name, $options: 'i' }
    }


    const count = await User.countDocuments({ name: { $regex: name, $options: 'i' } });
    const totalPages = Math.ceil(count / perPage);

    const users = await User.find(findQuery)
      .skip(skip)
      .limit(perPage);

    res.render('users-list', { users, msg, totalPages, currentPage: page, count, sort, name });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
};



//  * User Blocking
const userBlock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToBlock = await User.updateOne(
      { _id: id },
      { status: "Blocked" }
    );
    if (!userToBlock) {
      return res.status(404).send("User not found");
    }
    res.status(200).redirect("/admin/users");
  } catch (error) {
    console.error("Error blocking user:", error);
    res.redirect("/admin/users?msg=" + error.message);

  }
};
//  * User unblocking
const userUnblock = async (req, res) => {
  try {
    const id = req.params.id;
    const userToUnBlock = await User.updateOne(
      { _id: id },
      { status: "Active" }
    );
    if (!userToUnBlock) {
      return res.status(404).send("Blocked user not found");
    }
    res.status(200).redirect("/admin/users");
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.redirect("/admin/users?msg=" + error.message);
  }
};



//  * Aadmin logout 
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.clearCookie("adminToken");
        res.redirect("/admin/login");
      }
    });
  } catch (err) {

  }
};

// * for contacting the user 

const loadMessages = async (req, res) => {
  try {
    let sort = req.query.sort || 'pending'

    const messages = await Message.find({status:sort}).populate('userId')
    res.render("messages", { messages, sort })
  } catch (error) {
    console.log('error inloading messages :', error.message);
  }
}

// *for sending the replay to the user

const sendReply = async (req, res) => {
  try {
    const { message, email, id } = req.body;

    const msg = await Message.findByIdAndUpdate(
      id,
      {
        status: 'resolved',
        replayTime: new Date(),
        replay: message
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).redirect('/admin/messages')
  } catch (error) {
    console.error('Error in sending message:', error.message);
    res.status(500).json({ error: 'An error occurred while sending the message' });
  }
};


const loadBanners = async (req, res) => {
  try {
      const banners = await Banner.findOne()

      res.render("banners", { banners })
  } catch (error) {
      console.log('error in loading banners: ', error.message);
  }
}

const editBanner = async (req, res) => {
  try {
      const page = req.params.page;

      if (page === 'home-text') {
          const { field, text, index } = req.body;
          let updateField = '';

          switch (field) {
              case 'mainHeading':
                  updateField = `home.${index}.mainHeading`;
                  break;
              case 'url':
                  updateField = `home.${index}.url`;
                  break;
              case 'subHeading':
                  updateField = `home.${index}.subHeading`;
                  break;
              case 'caption':
                  updateField = `home.${index}.caption`;
                  break;
              default:
                  return res.status(400).json({ success: false, message: 'Invalid field' });
          }


          await Banner.updateOne({}, { $set: { [updateField]: text } });
          return res.status(200).json({ success: true, value: text });

      } else if (page === 'home') {
          const { index } = req.body;
          const newImg = req.file.filename;
          const update = {
              $set: {
                  [`home.${index}.img`]: `/images/banner-images/${newImg}`
              }
          };
          await Banner.updateOne({}, update);
          return res.status(200).json({ success: true, src: `/images/banner-images/${newImg}` });
      } else {
          const newImg = req.file.filename;
          const update = { [page]: `/images/banner-images/${newImg}` };
          await Banner.updateOne({}, { $set: update });
          return res.status(200).json({ success: true, src: update[page] });
      }
  } catch (error) {
      console.log('Error in editing banners:', error.message);
      return res.status(500).json({ success: false, message: error.message });
  }
};

const addHomeBanner = async (req, res) => {
  try {
      const { mainHeading, subHeading, url, caption } = req.body
      const img = req.file ? req.file.filename : ''
      await Banner.updateOne({}, {
          $push: {
              home: {
                  img: `/images/banner-images/${img}`,
                  mainHeading,
                  subHeading,
                  url,
                  caption
              }
          }
      })
      res.status(200).redirect("/admin/banner-managment")
  } catch (error) {
      console.log('error in adding new banner :', error.message);
      res.status(500)
  }
}


const deleteBanner = async (req, res) => {
  try {
      const index = req.params.index;

      const banner = await Banner.findOne();

      if (!banner || !banner.home || !Array.isArray(banner.home)) {
          return res.status(404).json({ message: 'Banner not found' });
      }

      if (index < 0 || index >= banner.home.length) {
          return res.status(404).json({ message: 'Banner not found' });
      }

      banner.home.splice(index, 1);

      await banner.save();

      res.status(200).json({ success: true });
  } catch (error) {
      console.log('Error in deleting banner:', error.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};







module.exports = {
  loadLogin,
  // loadOTP,
  // verifyOTP,
  // newOTP,
  checkLogin,
  loadUser,
  userBlock,
  userUnblock,
  loadMessages,
  logout,
  loadBanners,
  editBanner,
  addHomeBanner,
  deleteBanner,
  sendReply
};
