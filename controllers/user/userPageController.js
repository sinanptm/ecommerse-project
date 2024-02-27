const { Product, Order, CancelationReson, Category, Coupon, Message } = require("../../models/productModel")
const { User, Addresse, Wishlist, Wallet } = require("../../models/userModels")
const { getUserIdFromToken, bcryptCompare, makeHash, createHexId, isValidObjectId } = require('../../util/validations');
const { PDFDocument } = require("../../util/modules")


// * homepage Loading

const loadHome = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 12;
        const totalCount = await Product.countDocuments({ status: "Available" });
        const totalPages = Math.ceil(totalCount / limit);

        const skip = (page - 1) * limit;

        let products = await Product.find({ status: "Available" })
            .skip(skip)
            .limit(limit)
            .lean();

        let userid = '65a522f9b45bce5d065811c3'
        if (req.cookies.token || req.session.token) {
            userid = await getUserIdFromToken(req.cookies.token || req.session.token);
        }
        const wishlist = await Wishlist.findOne({ userid });

        if (products.length > 0) {
            products.forEach(product => {
                product.whishlist = false;
            });

        }

        if (wishlist) {
            products.forEach(product => {
                product.whishlist = wishlist.products.includes(product._id);
            });
        }

        // Check if products array is empty
        if (products.length === 0) {
            products = []; // Set products to an empty array
        }

        res.render("home", { products, totalPages, currentPage: page });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
};



// * for showing products 
const loadProducts = async (req, res) => {
    try {
        const name = req.query.name || ''
        const sort = req.query.sort || 'default';
        const category = req.query.category || 'all';
        const price = req.query.price || 'all';
        let page = parseInt(req.query.page, 10) || 1;
        let limit = 12;
        let skip = (page - 1) * limit;

        // Base query for products
        let findQuery = { status: "Available" };

        // Sorting logic
        let sortQuery = {};
        switch (sort) {
            case 'most_sold':
                sortQuery = { sales: -1 };
                break;
            case 'newness':
                sortQuery = { createdate: -1 };
                break;
            case 'price_low_to_high':
                sortQuery = { price: 1 };
                break;
            case 'price_high_to_low':
                sortQuery = { price: -1 };
                break;
            default:
                break;
        }

        if (name !== '') {
            findQuery.name = { $regex: new RegExp(name, 'i') };
        }


        if (category !== 'all') {
            const categoryDoc = await Category.findOne({ name: category });
            if (categoryDoc) {
                findQuery.categoryid = categoryDoc._id;
            }
        }

        const priceRanges = {
            '0-500': { $gte: 0, $lte: 500 },
            '500-1000': { $gte: 500, $lte: 1000 },
            '1000-2000': { $gte: 1000, $lte: 2000 },
            '2000-5000': { $gte: 2000, $lte: 5000 },
            '5000+': { $gte: 5000 }
        };

        if (price !== 'all') {
            findQuery.price = priceRanges[price];
        }



        let products = await Product.find(findQuery)
            .populate('categoryid')
            .sort(sortQuery)
            .limit(limit)
            .skip(skip)
            .lean();

        const categories = await Category.find();
        const totalCount = await Product.countDocuments(findQuery);
        const totalPages = Math.ceil(totalCount / limit);

        let userId = null;
        if (req.cookies.token || req.session.token) {
            userId = await getUserIdFromToken(req.cookies.token || req.session.token);
        }
        const wishlist = await Wishlist.findOne({ userid: userId });

        if (products.length > 0) {
            products.forEach(product => {
                product.whishlist = false;
            });

            if (wishlist) {
                products.forEach(product => {
                    product.whishlist = wishlist.products.includes(product._id);
                });
            }
            products[0].wishlist = true
        }

        res.render("product", {
            products,
            categories,
            totalPages,
            currentPage: page,
            sort,
            category,
            price,
            name
        });
    } catch (error) {
        console.error("Error in loadProducts:", error);
        res.status(500).send("Internal Server Error");
    }
};




// * for showing deltials of a product
const laodProductDetials = async (req, res) => {
    try {
        const id = req.query.id;

        if (! await isValidObjectId(id)) {
            res.status(400).redirect('/product-id-error');
            return;
        }

        let product = await Product.aggregate([
            { $match: { _id: createHexId(id) } },
            {
                $lookup: {
                    from: 'categories',
                    foreignField: "_id",
                    localField: "categoryid",
                    as: "category"
                }
            }
        ])
        product = product[0]

        if (product && product.category) {
            const categoryId = product.category[0]._id;
            const relatedProducts = await Product.find({ categoryid: categoryId });
            res.render("product-detail", { product, relatedProducts, });
        } else {
            res.status(404).send("Product not found");
        }

    } catch (error) {
        console.error("Error in loadProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};


// * for showing the user details 
const loadAccount = async (req, res) => {
    try {
        const userid = await getUserIdFromToken(req.cookies.token || req.session.token);
        const filter = req.query.filter || 'all';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;




        const user = await User.aggregate([
            { $match: { _id: createHexId(userid) } },
            {
                $lookup: {
                    from: "addresses",
                    foreignField: "_id",
                    localField: "address",
                    as: "address"
                }
            }
        ]);

        let filterQuery = { userid: createHexId(userid) };

        switch (filter) {
            case '5':
                filterQuery.orderStatus = '5';
                break;
            case '4':
                filterQuery.orderStatus = { $in: ['4', '6'] };
                break;
            case 'all':
                filterQuery.orderStatus = { $in: ['1', '2', '3'] };
                break;
            default:
                break;
        }

        const totalCount = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / limit);


        const orders = await Order.find(filterQuery)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        if (!user || user.length === 0) {
            return res.status(404).redirect('/home');
        }


        let invoice = false;
        for (const order of orders) {
            if (order.offlinePayment) {
                order.paymentType = 'offline'
            } else if (order.walletPayment) {
                order.paymentType = 'wallet'
            } else if (!order.online_payment) {
                order.paymentType = 'online_pending'
            } else if (order.online_payment) {
                order.paymentType = 'online'
            } else {
                order.paymentType = 'Not Available'
            }

            let isPending = false;

            if (order.paymentType == 'online_pending') {
                isPending = true
                invoice = true
            }
            order.isPending = isPending;
        }

        let wallet = await Wallet.findOne({ userid }).lean()
        wallet.transactions = wallet.transactions.reverse()

        // ? for deleting the expired coupon 
        await Coupon.deleteMany({ expDate: { $lt: Date.now() } })
        const coupons = await Coupon.find();

        const message = await Message.find({ userId: userid, status: 'resolved' })

        res.render('account-details', {
            user: user[0],
            editing: true,
            msg: req.query.msg,
            toast: req.query.toast,
            orders,
            filter,
            err: req.query.err,
            invoice,
            wallet,
            totalPages,
            currentPage: page,
            filter,
            coupons,
            message
        });

    } catch (error) {
        console.error(error);
        res.redirect('/home');
    }
};



const editDetails = async (req, res) => {
    try {
        const { username, name, gender, phone } = req.body;

        const id = await getUserIdFromToken(req.cookies.token || req.session.token);
        const newData = await User.findByIdAndUpdate(id, {
            $set: {
                name,
                gender,
                phone,
                username
            }
        });

        res.status(200).redirect("/account");
    } catch (error) {
        console.log(error.message);
        res.redirect('/account');
    }
};



const addAddress = async (req, res) => {
    try {
        const { Fname, Lname, companyName, country, streetAdress, city, state, pincode, mobile, email } = req.body;

        const userId = await getUserIdFromToken(req.cookies.token || req.session.token);

        const newAddress = new Addresse({
            Fname,
            Lname,
            userId,
            companyName,
            country,
            streetAdress,
            city,
            state,
            pincode,
            mobile,
            email
        });

        const address = await newAddress.save();

        const user = await User.findByIdAndUpdate(userId, { $push: { address: address._id } });

        if (req.query.ad) {
            res.redirect(req.query.ad);
        } else {
            res.status(200).redirect('/account');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/account?msg=' + error.message);
    }
};



// * for Changing password

const changePassword = async (req, res) => {
    try {
        const userid = await getUserIdFromToken(req.session.token || req.cookies.token);
        const { password, oldpass } = req.body;
        const user = await User.findById(userid);
        if (await bcryptCompare(oldpass, user.password) == false) {
            return res.status(302).redirect('/account?err=Incorrect password')
        } else {
            const pass = await makeHash(password);
            await User.findByIdAndUpdate(userid, { $set: { password: pass } });
            res.redirect('/account?err=password changed')
        }
    } catch (error) {
        console.log(error.message);
        return res.status(404).redirect('/account?msg=error in changin passwerd ' + error.message);
    }
}


// * for editting address

const edittAddress = async (req, res) => {
    try {
        const { Fname, Lname, companyName, country, streetAdress, city, state, pincode, mobile, email } = req.body;
        const { id } = req.params; // Assuming the addressId is part of the request parameters

        const updatedAddress = await Addresse.findByIdAndUpdate(id, {
            $set: {
                Fname,
                Lname,
                companyName,
                country,
                streetAdress,
                city,
                state,
                pincode,
                mobile,
                email
            }
        });

        if (!updatedAddress) {
            // return res.status(404).redirect('/account?msg=Address not found');
        }

        res.status(200).redirect('/account');
    } catch (error) {
        console.log(error.message);
        res.status(500).redirect('/account?msg=' + error.message);
    }
};

// * for Canceling a order 
const cancelOrder = async (req, res) => {
    try {
        const { orderId, cancelReason } = req.body;

        if (!orderId) {
            throw new Error("Order ID is required");
        }

        const userid = await getUserIdFromToken(req.cookies.token || req.session.token);

        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: "5" });

        if (!userid || !order) {
            return res.status(302).redirect("/account");
        }

        const newReason = new CancelationReson({
            userid,
            orderid: orderId,
            cancelationTime: Date.now(),
            reason: cancelReason,
            type: "cancel"
        });
        await newReason.save();
        if (order.paymentStatus == 'completed' && (typeof order.offlinePayment === 'undefined' || order.offlinePayment === null || order.offlinePayment === false)) {
            if (await Wallet.findOne({ userid })) {
                await Wallet.updateOne({ userid }, {
                    $set: { updatedAt: new Date() },
                    $push: {
                        transactions: {
                            type: 'credit',
                            amount: order.orderAmount,
                            orderid: order._id
                        }
                    },
                    $inc: { balance: order.orderAmount }
                });

            } else {
                const newWallet = new Wallet({
                    userid,
                    createdAt: new Date(),
                    balance: order.orderAmount,
                    transactions: [{
                        type: 'credit',
                        amount: order.orderAmount,
                        orderid: order._id,
                    }],
                    updatedAt: new Date(),
                });
                await newWallet.save();
            }
        }

        res.status(200).redirect('/account');
    } catch (error) {
        console.error(error.message);
        res.status(500).redirect('/account?msg=' + error.message);
    }
};


const returnOrder = async (req, res) => {
    try {
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
        const orderId = req.query.id;
        const cancelReason = req.query.msg;

        if (!isValidObjectId(orderId)) {
            return res.status(404).json({ message: "Invalid Order ID" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order Not Found" });
        }

        order.orderStatus = '6';
        await order.save();

        const newReason = new CancelationReson({
            userid: userId,
            orderid: orderId,
            cancelationTime: Date.now(),
            reason: cancelReason,
            type: "cancel"
        });
        await newReason.save();

        if (order.paymentStatus === 'completed') {
            let wallet = await Wallet.findOne({ userid: userId });

            if (wallet) {
                await wallet.updateOne({
                    $set: { updatedAt: new Date() },
                    $push: {
                        transactions: {
                            type: 'credit',
                            amount: order.orderAmount,
                            orderid: order._id
                        }
                    },
                    $inc: { balance: order.orderAmount }
                });
            } else {
                wallet = new Wallet({
                    userid: userId,
                    createdAt: new Date(),
                    balance: order.orderAmount,
                    transactions: [{
                        type: 'credit',
                        amount: order.orderAmount,
                        orderid: order._id,
                    }],
                    updatedAt: new Date(),
                });
                await wallet.save();
            }
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error returning order:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


// * for deleting address
const deleteAddress = async (req, res) => {
    try {

        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const addressid = req.params.id
        const address = await Addresse.findByIdAndDelete(addressid)
        const userAddress = await User.findByIdAndUpdate(userId, { $pull: { address: addressid } })
        res.status(200).json({ succes: true })
    } catch (error) {
        console.log(error.message);
        res.redirect('/account?msg=' + error.message);
    }
}


// * To create invoice of user
const createInvoice = async (req, res) => {
    try {
        const userid = await getUserIdFromToken(req.cookies.token || req.session.token);

        const pendings = await Order.find({
            userid,
            paymentStatus: 'pending',
            $or: [
                { offlinePayment: { $exists: false } },
                { offlinePayment: false }
            ],
            orderStatus: { $nin: ['4', '5'] }
        }).populate('OrderedItems.productid');

        // Create a new PDF document
        const doc = new PDFDocument();

        // Pipe the PDF content to a buffer
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
            res.send(pdfBuffer);
        });

        // Generate the PDF content
        generateInvoice(doc, pendings);

        // Finalize the PDF document
        doc.end();

    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Error creating invoice' });
    }
};

function calculateTotalAmount(orders) {
    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.orderAmount;
    });
    return totalAmount;
}

function generateInvoice(doc, orders) {
    // Set font and font size
    doc.font('Helvetica');

    // Title
    doc.fontSize(24).text('Invoice', { align: 'center' }).moveDown();

    // Information
    doc.fontSize(14).text('Kindly complete your pending payments to receive your orders', { align: 'center' });
    doc.text('User ID: SK203', { align: 'center' }).moveDown();

    // Table header
    const tableTop = doc.y + 20;
    const colWidths = [150, 250, 100, 100];
    const rowHeight = 30;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Order ID', 50, tableTop);
    doc.text('Product Name', 200, tableTop);
    doc.text('Quantity', 400, tableTop);
    doc.text('Price', 500, tableTop);

    // Table rows
    doc.font('Helvetica');
    let yPos = tableTop + rowHeight;

    orders.forEach(order => {
        const orderId = 'SK' + Math.floor(100000 + Math.random() * 900000);
        order.OrderedItems.forEach(item => {
            doc.text(orderId, 50, yPos);
            doc.text(item.name, 200, yPos, { width: colWidths[1] });
            doc.text(item.quantity.toString(), 400, yPos);
            const price = Math.round(((item.price - (item.price * item.discount / 100)) * item.quantity));
            doc.text(price, 500, yPos);
            yPos += rowHeight;
        });
    });

    // Total amount
    const totalAmount = calculateTotalAmount(orders);
    const totalInvoiceText = `Total Invoice Amount: $${totalAmount.toFixed(2)}`;
    const thankYouText = 'Thank you for shopping with TRENDS';
    const maxLength = Math.max(totalInvoiceText.length, thankYouText.length);
    const totalInvoiceLine = `${totalInvoiceText}${' '.repeat(maxLength - totalInvoiceText.length)}`;
    const thankYouLine = `${thankYouText}${' '.repeat(maxLength - thankYouText.length)}`;



    doc.moveDown(2); 
    doc.fontSize(14).text(totalInvoiceLine, yPos);
    doc.fontSize(14).text(thankYouLine, { align: 'left' });
}








// * for Contactinng

const loadContact = async (req, res) => {
    try {
        const credential = req.query.credential
        res.render("contact", { credential })

    } catch (error) {

    }
}


// * For Contacting admim
const contactAdmin = async (req, res) => {
    try {
        const token = req.cookies.token || req.session.token
        let user
        const { msg, email } = req.body
        if (token == null || typeof token == 'undefined') {
            res.status(401).json({ credential: false })
            return
        } else {

            user = await User.findById(await getUserIdFromToken(token))
            if (!user) {
                res.status(401).json({ credential: false })
                return
            }
        }

        const newMessage = new Message({
            sendTime: new Date,
            email: email || user.email,
            userId: user._id,
            status: "pending",
            message: msg,
        });

        await newMessage.save();
        res.status(200).json({ credential: true, succes: true })

    } catch (error) {
        console.error('error while sendunbg message ', error);
    }
}



const markAsRead = async (req, res) => {
    try {
        const id = req.params.id
        await Message.findByIdAndUpdate(id, { $set: { status: 'closed' } })
        res.status(200).redirect("/account")
    } catch (error) {
        console.log('error in seen message : ', error.message);
    }
}


const loadAbout = async (req, res) => {
    try {
        res.render("about", {})
    } catch (error) {

    }
}



module.exports = {
    loadHome,
    loadProducts,
    laodProductDetials,
    loadAbout,
    loadContact,
    loadAccount,
    editDetails,
    addAddress,
    deleteAddress,
    edittAddress,
    cancelOrder,
    returnOrder,
    changePassword,
    createInvoice,
    contactAdmin,
    markAsRead
}