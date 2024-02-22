const { mongoose } = require("../util/modules")

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  gender: { type: String },
  phone: { type: Number },
  password: { type: String, required: true },
  address: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
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
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", unique: false }],
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);



// wallet schema
const walletSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String },
      amount: { type: Number },
      date: { type: Date, default: Date.now },
      orderid:{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Wallet = mongoose.model("Wallet", walletSchema);


// Cart Schema
const cartSchema = new mongoose.Schema({
  products: [{
    productid: { type: mongoose.Schema.Types.ObjectId, ref: "Product", unique: false },
    quantity: Number,
  }],
  items: { type: Number, default: 0 },
  createdate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
});

const Cart = mongoose.model("Cart", cartSchema);


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
  Cart,
  Wallet,
  Admin,
};
