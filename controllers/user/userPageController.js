const { name } = require("ejs");
const { Product, Order, CancelationReson, Category } = require("../../models/productModel")
const { User, Addresse, Wishlist } = require("../../models/userModels")
const { getUserIdFromToken, bcryptCompare, makeHash, createHexId, isValidObjectId } = require('../../util/validations');
const { Error } = require("mongoose");

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
        const name = req.query.name ||''
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

        products.forEach(product => {
            product.wishlist = false;
        });

        if (wishlist) {
            products.forEach(product => {
                product.wishlist = wishlist.products.includes(product._id);
            });
        }

        res.render("product", { products, categories, totalPages, currentPage: page, sort, category, price , name });
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

const laodAccount = async (req, res) => {
    try {
        const token = req.cookies.token || req.session.token;
        let userid
        if (token) {
            userid = await getUserIdFromToken(token);
        } else {
            return res.status(304).redirect('/')
        }

        const user = await User.aggregate([
            { $match: { _id: createHexId(userid) } },
            {
                $lookup: {
                    from: "addresses",
                    foreignField: "_id",
                    localField: "address",
                    as: "address"
                }
            },
        ])


        const orders = await Order.aggregate([
            { $match: { userid: createHexId(userid) } }, // Match against userid field
            {
                $lookup: {
                    from: "products",
                    localField: "OrderedItems.productid",
                    foreignField: "_id",
                    as: 'OrderedItems'
                }
            },
        ]);


        const msg = req.query.msg;


        if (!user) {
            res.status(404);
            return res.redirect('/home');
        }

        res.render('account-details', { user: user[0], editing: true, msg, toast: req.query.toast, orders, err: req.query.err });
    } catch (error) {
        console.error(error);
        res.redirect('/home');
    }
};


// * Editt details 

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

// * for adding new address


const addAddress = async (req, res) => {
    try {
        const { Fname, Lname, companyName, country, streetAdress, city, state, pincode, mobile, email } = req.body;


        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)

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

        const user = await User.findByIdAndUpdate(userId, { $push: { address: address._id } })

        if (req.query.ad) {
            res.redirect(req.query.ad)
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
            return res.status(404).redirect('/account?msg=Address not found');
        }

        // Redirect to the user's account page or handle the response as needed
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
        const userid = await getUserIdFromToken(req.cookies.token || req.session.token);

        if (!userid || !orderId) {
            return res.status(302).redirect("/account");
        }
        const newReason = new CancelationReson({
            userid,
            orderid: orderId,
            cancelationTime: Date.now(),
            reason: cancelReason
        });

        const cancel = await newReason.save();
        const order = await Order.findByIdAndUpdate({ _id: cancel.orderid }, { $set: { orderStatus: "5" } });
        if (order.orderStatus == '5') {
            res.status(200).redirect('/account');
        } else {
            throw new Error("no fdj")
        }
    } catch (error) {
        console.log(error.message);
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






// * for showing deltials of us

const loadAbout = async (req, res) => {
    try {
        res.render("about", {})
    } catch (error) {

    }
}



// * for contacing us

const loadContact = async (req, res) => {
    try {
        res.render("contact", {})

    } catch (error) {

    }
}

// * to show the the blogs about us

const loadBlog = async (req, res) => {
    try {
        res.render("blog", {})

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
    laodProductDetials,
    loadProducts,
    loadAbout,
    loadBlog,
    loadContact,
    laodAccount,
    editDetails,
    addAddress,
    deleteAddress,
    edittAddress,
    loadEror,
    cancelOrder,
    changePassword
}