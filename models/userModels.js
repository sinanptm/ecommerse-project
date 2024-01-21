const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  gender: { type: String },
  phone: { type: Number },
  password: { type: String, required: true },
  addressid: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
  createdate: { type: Date, default: Date.now },
  updated: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false },
  status: { type: String, default: "Active" },
  token: { type: String, unique: true },
});

const User = mongoose.model("User", userSchema);

// Address Schema
const addressSchema = new mongoose.Schema({
  Fname: { type: String },
  Lname: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyName: { type: String },
  country: { type: String },
  streetAdress: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: Number },
  mobile: { type: Number },
  email: { type: String },
});

const Addresse = mongoose.model("Address", addressSchema);

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  productsid: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);


// Coupons Schema
const couponsSchema = new mongoose.Schema({
  couponName: { type: String },
  couponCode: { type: String },
  discAmt: { type: Number },
  ParchaseAmount: { type: Number },
  createdate: { type: Date },
  expDate: { type: Date },
});

const Coupon = mongoose.model("Coupon", couponsSchema);
// wallet schema
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, default: 0 },
  productid: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
});

const Wallet = mongoose.model("Wallet", walletSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  products: [{
    productid: { type: mongoose.Schema.Types.ObjectId, ref: "Product", unique: true },
    quantity: Number,
    price: Number
  }],
  totalPrice: { type: Number },
  items: { type: Number, default: 0 },
  createdate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
});

const Cart = mongoose.model("Cart", cartSchema);

// Payment Schema
const paymentSchema = new mongoose.Schema({
  orderid: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number },
  currency: { type: String },
  status: { type: String },
  paymentMethod: { type: String },
  transactionid: { type: mongoose.Schema.Types.ObjectId },
  createdate: { type: Date },
  updated: { type: Date },
});

const Payment = mongoose.model("Payment", paymentSchema);

// OrderItems Schema
const orderItemsSchema = new mongoose.Schema({
  orderid: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  productsid: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number },
});

const OrderItem = mongoose.model("OrderItem", orderItemsSchema);

// Banner Schema
const bannerSchema = new mongoose.Schema({
  mainHeader: { type: String },
  subHeader: { type: String },
  URL: { type: String },
  img: { type: Buffer },
});

const Banner = mongoose.model("Banner", bannerSchema);

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  token: { type: String },
  is_Admin: { type: Boolean, default: false },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = {
  User,
  Addresse,
  Wishlist,
  Coupon,
  Cart,
  Payment,
  OrderItem,
  Banner,
  Wallet,
  Admin,
};
