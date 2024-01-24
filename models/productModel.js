const mongoose = require("mongoose");

// Products Schema
const productsSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number },
    quantity: { type: Number },
    status: { type: String },
    img: { type: Array },
    categoryid: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    createdate: { type: Date },
    discount: { type: Number },
    description:{type:String}
});
productsSchema.index({ name: 1, categoryid: 1 }, { unique: true });

const Product = mongoose.model("Product", productsSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    type: { type: String },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    img: { type: String },
});

const Category = mongoose.model("Category", categorySchema);


// Orders Schema
const ordersSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderAmount: { type: Number },
    deliveryAddress: { type: String },
    orderDate: { type: Date },
    orderStatus: { type: String },
    deliveryDate: { type: Date },
    ShippingDate: { type: Date },
    OrderedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }],
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
});

const Order = mongoose.model("Order", ordersSchema);


module.exports = {
    Order,
    Product,
    Category
}