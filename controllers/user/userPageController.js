const { Product, Order, CancelationReson, Category, Coupon, Message } = require("../../models/productModel")
const { User, Addresse, Wishlist, Wallet } = require("../../models/userModels")
const { getUserIdFromToken, bcryptCompare, makeHash, createHexId, isValidObjectId } = require('../../util/validations');
const { puppeteer } = require("../../util/modules")


// * homepage Loading

const loadHome = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 12;
        const totalCount = await Product.countDocuments({ status: "Available" });
        const totalPages = Math.ceil(totalCount / limit);

        const skip = (page - 1) * limit;

        const products = await Product.find({ status: "Available" })
            .skip(skip)
            .limit(limit)
            .lean();

        let userid = products[0]._id
        if (req.cookies.token || req.session.token) {
            userid = await getUserIdFromToken(req.cookies.token || req.session.token);

        }
        const wishlist = await Wishlist.findOne({ userid });

        products.forEach(product => {
            product.whishlist = false;
        });

        if (wishlist) {
            products.forEach(product => {
                product.whishlist = wishlist.products.includes(product._id);
            });
        }
        products[0].wishlist = true
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

        res.render("product", { products, categories, totalPages, currentPage: page, sort, category, price, name });
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
                filterQuery.orderStatus = '4';
                break;
            case 'all':
                filterQuery.orderStatus = { $in: ['1', '2', '3'] }; // Adjusted to include all relevant statuses
                break;
            default:
                break;
        }

        const totalCount = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / limit);

        const orders = await Order.aggregate([
            { $match: filterQuery },
            {
                $lookup: {
                    from: "products",
                    localField: "OrderedItems.productid",
                    foreignField: "_id",
                    as: 'OrderedItems'
                }
            }
        ]).sort({ orderDate: -1 }).skip(skip).limit(limit)


        if (!user || user.length === 0) {
            return res.status(404).redirect('/home');
        }

        const pendings = await Order.find({
            userid,
            paymentStatus: 'pending',
            $or: [
                { offlinePayment: { $exists: false } },
                { offlinePayment: false }
            ],
            orderStatus: { $nin: ['4', '5'] }
        })

        const wallet = await Wallet.findOne({ userid });


        const coupons = await Coupon.find();

        const message = await Message.find({userId:userid,status:'resolved'})

        res.render('account-details', {
            user: user[0],
            editing: true,
            msg: req.query.msg,
            toast: req.query.toast,
            orders,
            filter,
            err: req.query.err,
            pendings,
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
            reason: cancelReason
        });
        await newReason.save();
        if (order.paymentStatus !== 'completed' && (typeof order.offlinePayment === 'undefined' || order.offlinePayment === null || order.offlinePayment === false)) {
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

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        await page.setContent(`  
            ${generateOrderTable(pendings)}
        `);

        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Error creating invoice' });
    }
};


// * For Genreating html table for invoice
function generateOrderTable(orders) {
    let html = `
        <div style="font-family: Arial, sans-serif; margin: 0 auto; max-width: 600px;">
            <h1 style="text-align: center; color: #333;">Invoice</h1>
            <p style="text-align: center; color: #666;">Kindly complete your pending payments to receive your orders</p>
            <p style="text-align: center; color: #666;">User ID: SK203</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 10px; text-align: left;">Order ID</th>
                        <th style="padding: 10px; text-align: left;">Product Name</th>
                        <th style="padding: 10px; text-align: left;">Quantity</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalAmount = 0;

    orders.forEach(order => {
        const orderId = 'SK' + Math.floor(100000 + Math.random() * 900000);
        let orderAmount = 0;

        order.OrderedItems.forEach((item, index) => {
            orderAmount += item.price * item.quantity;
            if (index === 0) {
                html += `
                    <tr>
                        <td style="padding: 10px;">${orderId}</td>
                        <td style="padding: 10px;">${item.name}</td>
                        <td style="padding: 10px;">${item.quantity}</td>
                        <td style="padding: 10px;">$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td></td>
                        <td style="padding: 10px;">${item.name}</td>
                        <td style="padding: 10px;">${item.quantity}</td>
                        <td style="padding: 10px;">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        totalAmount += orderAmount;
    });

    html += `
                </tbody>
            </table>
            <p style="text-align: right; color: #333; margin-top: 20px;">Total Invoice Amount: ${totalAmount.toFixed(2)}</p>
            <p style="text-align: right; color: #666;">Thank you for shopping with TRENDS</p>
        </div>
    `;

    return html;
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
            email:email ||user.email,
            userId:user._id,
            status: "pending",
            message: msg,
        });

        await newMessage.save();
        res.status(200).json({ credential: true, succes: true })

    } catch (error) {
        console.error('error while sendunbg message ', error);
    }
}



const markAsRead = async(req,res)=>{
    try {
        const id = req.params.id
        await Message.findByIdAndUpdate(id,{$set:{status:'closed'}})
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


// * for showing erros
const loadEror = async (req, res) => {
    try {
        if (!req.query.msg) {
            res.redirect('/')
        }
        res.render('error', { toast: req.query.toast, msg: req.query.msg })
    } catch (error) {
        console.log('error on error page ' + error.message)
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
    loadEror,
    cancelOrder,
    changePassword,
    createInvoice,
    contactAdmin,
    markAsRead
}