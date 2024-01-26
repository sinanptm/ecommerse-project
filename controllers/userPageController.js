const { Product } = require("../models/productModel")
const { Cart, User, Addresse } = require("../models/userModels")
const { getUserIdFromToken } = require('../util/bcryption')

// * homepage Loading

const loadHome = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { $match: { status: "Available" } },
            { $sample: { size: 2000 } }
        ]);

        res.render("home", { products, });

    } catch (error) {
        console.error("Error in loadHome:", error);
        res.status(500).send("Internal Server Error");
    }
};

// * for showing products 
const loadProducts = async (req, res) => {
    try {
        const products = await Product.
            find({ status: "Available" })
            .populate({
                path: 'categoryid',
                model: 'Category',
                select: 'name description img type'
            });
        res.render("product", { products, });

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

        if (product && product.categoryid) {
            const categoryId = product.categoryid._id;
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
        const userId = await getUserIdFromToken(token);

        const user = await User.findById(userId).populate('address');

        const msg = req.query.msg;
        if (!user) {
            res.status(404);
            return res.redirect('/home');
        }

        res.render('account-details', { user, editing: true, msg });
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
        }else{
            res.status(200).redirect('/account');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/account?msg=' + error.message);
    }
};

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
            // Handle the case where the address with the given ID is not found
            console.log('0214');
            return res.status(404).redirect('/account?msg=Address not found');
        }

        // Redirect to the user's account page or handle the response as needed
        res.status(200).redirect('/account');
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
        res.status(200).redirect('/account')
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
    edittAddress
}