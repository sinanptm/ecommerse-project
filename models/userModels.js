const { Schema, ObjectId, model } = require("mongoose");

// User Schema
const userSchema = new Schema({
  email: { type: String, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  gender: { type: String },
  phone: { type: Number },
  password: { type: String, required: true },
  address: [{ type: ObjectId, ref: "Address" }],
  createdate: { type: Date, default: Date.now },
  updated: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false },
  status: { type: String, default: "Active" },
  token: { type: String, unique: true },
});

const User = model("User", userSchema);

// Address Schema
const addressSchema = new Schema({
  Fname: { type: String },
  Lname: { type: String },
  userId: { type: ObjectId, ref: "User" },
  companyName: { type: String },
  country: { type: String },
  streetAdress: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: Number },
  mobile: { type: Number },
  email: { type: String },
});

const Addresse = model("Address", addressSchema);

// Wishlist Schema
const wishlistSchema = new Schema({
  products: [{ type: ObjectId, ref: "Product", unique: false }],
  userid: { type: ObjectId, ref: "User" },
});

const Wishlist = model("Wishlist", wishlistSchema);



// wallet schema
const walletSchema = new Schema({
  userid: { type: ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String },
      amount: { type: Number },
      date: { type: Date, default: Date.now },
      orderid: { type: ObjectId, ref: "Order" }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Wallet = model("Wallet", walletSchema);


// Cart Schema
const cartSchema = new Schema({
  products: [{
    productid: { type: ObjectId, ref: "Product", unique: false },
    quantity: Number,
  }],
  items: { type: Number, default: 0 },
  createdate: { type: Date },
  userId: { type: ObjectId, ref: "User", unique: true },
});

const Cart = model("Cart", cartSchema);


const adminSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  token: { type: String },
  is_Admin: { type: Boolean, default: false },
});

const Admin = model("Admin", adminSchema);

module.exports = {
  User,
  Addresse,
  Wishlist,
  Cart,
  Wallet,
  Admin,
};
