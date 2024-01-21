const { Product } = require("../models/productModel")
const { Cart } = require("../models/userModels")
const { getUserIdFromToken } = require('../util/bcryption')

// * homepage Loading

const loadHome = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { $match: { status: "Available" } },
            { $sample: { size: 2000 } }
        ]);
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;
        res.render("home", { products, valid: req.cookies.token,cartItems });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
};

// * for showing products 
const loadProducts = async (req, res) => {
    try {
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;
        const products = await Product.
            find({ status: "Available" })
            .populate({
                path: 'categoryid',
                model: 'Category',
                select: 'name description img type'
            });
        res.render("product", { products, valid: req.cookies.token, cartItems });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
}


// * for showing deltials of a product
const laodProductDetials = async (req, res) => {
    try {
        const id = req.query.id;

        const product = await Product
            .findById(id)
            .populate({
                path: 'categoryid',
                model: 'Category',
                select: 'name description img'
            });
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;

        if (product && product.categoryid) {
            const categoryId = product.categoryid._id;
            const relatedProducts = await Product.find({ categoryid: categoryId });
            res.render("product-detail", { product, relatedProducts, valid: req.cookies.token, cartItems});
        } else {
            res.status(404).send("Product not found");
        }
    } catch (error) {
        console.error("Error in loadProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};



// * for showing deltials of us

const loadAbout = async (req, res) => {
    try {
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;
        res.render("about", { valid: req.cookies.token,cartItems })
    } catch (error) {

    }
}

// * for contacing us

const loadContact = async (req, res) => {
    try {
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;
        res.render("contact", { valid: req.cookies.token , cartItems})

    } catch (error) {

    }
}

// * to show the the blogs about us

const loadBlog = async (req, res) => {
    try {
        const userId = await getUserIdFromToken(req.cookies.token || req.session.token)
        const cart = await Cart.findOne({ userId })
        const cartItems = cart ? cart.items || 0 : 0;
        res.render("blog", { valid: req.cookies.token, cartItems })

    } catch (error) {

    }
}


module.exports = {
    loadHome,
    laodProductDetials,
    loadProducts,
    loadAbout,
    loadBlog,
    loadContact
}