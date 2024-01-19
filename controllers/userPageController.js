const userModels = require("../models/userModels");
const { trusted } = require("mongoose");

// * homepage Loading

const loadHome = async (req, res) => {
    try {
        const products = await userModels.Product.aggregate([
            { $match: { status:"Available" } },
            { $sample: { size: 2000 } }
        ]);
        res.render("home", { products, valid: req.cookies.token });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
};

// * for showing products 
const loadProducts = async (req, res) => {
    try {
        const products = await userModels.Product.aggregate([
            { $match: { status:"Available" } },
            { $sample: { size: 2000 } }
        ]);
        res.render("product", { products, valid: req.cookies.token });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
}

// * for showing deltials of a product
const laodProductDetials = async (req, res) => {
    try {
        const id = req.query.id;

        const product = await userModels.Product
            .findById(id)
            .populate({
                path: 'categoryid',
                model: 'Category',
                select: 'name description img'
            });

        if (product && product.categoryid) {
            const categoryId = product.categoryid._id;

            const relatedProducts = await userModels.Product.find({ categoryid: categoryId });

            res.render("product-detail", { product, relatedProducts, valid: req.cookies.token });
        } else {
            res.status(404).send("Product not found");
        }
    } catch (error) {
        console.error("Error in loadProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};

// * for showing the cart of a user

const loadCart = async (req, res) => {
    try {
        res.render("cart", { valid: req.cookies.token })

    } catch (error) {

    }
}


// * for showing deltials of us

const loadAbout = async (req, res) => {
    try {
        res.render("about", { valid: req.cookies.token })
    } catch (error) {

    }
}

// * for contacing us

const loadContact = async (req, res) => {
    try {
        res.render("contact", { valid: req.cookies.token })

    } catch (error) {

    }
}

// * to show the the blogs about us

const loadBlog = async (req, res) => {
    try {
        res.render("blog", { valid: req.cookies.token })

    } catch (error) {

    }
}


module.exports = {
    loadHome,
    laodProductDetials,
    loadProducts,
    loadAbout,
    loadBlog,
    loadCart,
    loadContact
}