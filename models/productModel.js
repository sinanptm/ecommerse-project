const { Schema, ObjectId, model } = require("mongoose");

// Products Schema
const productsSchema = new Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number },
    quantity: { type: Number },
    status: { type: String },
    img: { type: Array },
    categoryid: { type: ObjectId, ref: "Category" },
    createdate: { type: Date },
    discount: { type: Number },
    description: { type: String },
    sales: { type: Number, default: 13 }
});
productsSchema.index({ name: 1, categoryid: 1 }, { unique: true });

const Product = model("Product", productsSchema);

// Category Schema
const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    type: { type: String },
    items: [{ type: ObjectId, ref: "Product" }],
    createdate: { type: Date },
    img: { type: String },
    sales: { type: Number, default: 0 }
});

const Category = model("Category", categorySchema);


// Orders Schema
const ordersSchema = new Schema({
    userid: { type: ObjectId, ref: "User" },
    orderAmount: { type: Number },
    deliveryAddress: {
        id: { type: ObjectId, ref: "Address" },
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
    },
    coupon: Number,
    orderDate: { type: Date },
    orderStatus: { type: String },
    deliveryDate: { type: Date },
    ShippingDate: { type: Date },
    OrderedItems: [{
        productid: { type: ObjectId, ref: "Product" },
        price: Number,
        quantity: Number,
        discount: Number,
        name: String,
        img: String
    }],
    walletPayment: {
        transactionid: String,
        date: Date
    },
    online_payment: {
        currency: { type: String },
        status: { type: String },
        transactionid: String,
        createdate: { type: Date },
    },
    offlinePayment: Boolean,
    paymentStatus: String
});

const Order = model("Order", ordersSchema);

const cancelReasonschema = new Schema({
    orderid: { type: ObjectId, ref: "Order" },
    userid: { type: ObjectId, ref: "User" },
    reason: String,
    cancelationTime: Date
})

const CancelationReson = model("CancelationReson", cancelReasonschema)


// Coupons Schema
const couponsSchema = new Schema({
    name: { type: String },
    code: { type: String },
    discAmt: { type: Number },
    createdate: { type: Date },
    expDate: { type: Date },
    used: Number,
    minAmount:Number
});

const Coupon = model("Coupon", couponsSchema);

//  for customer service 

const messageSchema = new Schema({
    email: { type: String, required: true },
    userId: { type: ObjectId, ref: "User", required: true },
    message: { type: String, },
    sendTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'resolved', 'closed'], default: 'pending' },
    replay: String,
    replayTime: Date,
    seen: Date
});

const Message = model('Message', messageSchema);


module.exports = {
    Order,
    Product,
    Category,
    CancelationReson,
    Coupon,
    Message
}