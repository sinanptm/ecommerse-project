const { mongoose } = require("../util/modules")

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
    description: { type: String },
    sales: { type: Number, default: 13 }
});
productsSchema.index({ name: 1, categoryid: 1 }, { unique: true });

const Product = mongoose.model("Product", productsSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    type: { type: String },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    createdate: { type: Date },
    img: { type: String },
    sales: { type: Number, default: 0 }
});

const Category = mongoose.model("Category", categorySchema);


// Orders Schema
const ordersSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderAmount: { type: Number },
    deliveryAddress: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
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
    },
    coupon:Number,
    orderDate: { type: Date },
    orderStatus: { type: String },
    deliveryDate: { type: Date },
    ShippingDate: { type: Date },
    OrderedItems: [{
        productid: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        price: Number,
        quantity: Number,
        discount:Number,
        name: String
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

const Order = mongoose.model("Order", ordersSchema);

const cancelReasonschema = new mongoose.Schema({
    orderid: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: String,
    cancelationTime: Date
})

const CancelationReson = mongoose.model("CancelationReson", cancelReasonschema)


// Coupons Schema
const couponsSchema = new mongoose.Schema({
    name: { type: String },
    code: { type: String },
    discAmt: { type: Number },
    createdate: { type: Date },
    expDate: { type: Date },
    used: Number
});

const Coupon = mongoose.model("Coupon", couponsSchema);

//  for customer service 

const messageSchema = new mongoose.Schema({
    email: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, },
    sendTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'resolved', 'closed'], default: 'pending' },
    replay:String,
    replayTime:Date,
    seen:Date
});

const Message = mongoose.model('Message', messageSchema);


module.exports = {
    Order,
    Product,
    Category,
    CancelationReson,
    Coupon,
    Message
}