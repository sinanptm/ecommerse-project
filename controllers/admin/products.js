const { Product, Category } = require("../../models/productModel");
const { createHexId, isValidObjectId } = require('../../util/validations');
const { sharp, path } = require("../../util/modules");

//  * product management
const loadProducts = async (req, res) => {
    try {
        const sort = req.query.sort || 'all';
        const name = req.query.name || '';
        const sort2 = req.query.sort2 || 'all';
        const perPage = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * perPage;
        const catogories = await Category.find();

        let findQuery = {};

        if (name !== '') {
            findQuery.name = { $regex: new RegExp(name, 'i') };
        }

        if (sort === 'listed') {
            findQuery.status = 'Available';
        } else if (sort === 'unlisted') {
            findQuery.status = 'Disabled';
        }

        if (isValidObjectId(sort2)) {
            findQuery.categoryid = sort2;
        }

        const products = await Product.find(findQuery)
            .sort({ createdate: -1 })
            .skip(skip)
            .limit(perPage);

        const count = await Product.countDocuments(findQuery);
        const totalPages = Math.ceil(count / perPage);
        res.render("products-list", { products, totalPages, currentPage: page, count, sort, catogories, sort2, name }); // Passing data to template
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Internal Server Error"); // Sending error response
    }
};




//  * add products
const loadAddProduct = async (req, res) => {
    try {
        const msg = req.query.msg;
        const catogories = await Category.find();
        res.render("addProducts", { catogories: catogories, msg });
    } catch (error) {
        console.log(error.message);
        res.status(404).json(error.message);
    }
};



// * to add now product

const addProduct = async (req, res) => {
    try {
        const { name, price, quantity, status, categoryid, discount, description } = req.body;
        const images = req.files.map(file => file.filename);

        const promises = images.map(async (image) => {
            const originalImagePath = path.join(__dirname, '../../public/product_images', image); // Adjust the path
            const resizedPath = path.join(__dirname, '../../public/resized_images', image); // Adjust the path
            await sharp(originalImagePath)
                .resize({ height: 1486, width: 1200, fit: 'fill' })
                .toFile(resizedPath);
            return image;
        });

        const img = await Promise.all(promises);

        const product = new Product({
            name,
            price,
            quantity,
            status,
            img,
            description,
            categoryid,
            createdate: new Date(),
            discount,
        });

        const savedProduct = await product.save();
        await Category.findByIdAndUpdate(categoryid, { $push: { items: savedProduct._id } });

        res.redirect("/admin/addProduct?msg=Product added seccussfully")

    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error (MongoDB error code 11000)
            res.redirect("/admin/addProduct?msg=Product with this name already exists");
        } else {
            // Other errors
            console.error(error);
            res.redirect("/admin/addProduct?msg=" + error.message);
        }
    }
};


// * to edit a product

const loadEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const type = req.query.type

        const pp = await Product.findOne({ _id: id })
        if (!id || !pp) {
            console.log("Redirecting to /admin/products");
            res.status(400).redirect("/admin/productscsa");
            return;
        }

        const product = await Product.aggregate([
            { $match: { _id: createHexId(id) } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryid",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: 1,
                    price: 1,
                    quantity: 1,
                    status: 1,
                    category: {
                        name: 1,
                        description: 1,
                        _id: 1
                    },
                    description: 1,
                    createdate: 1,
                    discount: 1,
                    img0: { $arrayElemAt: ["$img", 0] },
                    img1: { $arrayElemAt: ["$img", 1] },
                    img2: { $arrayElemAt: ["$img", 2] }
                }
            }
        ]);


        if (!product) {
            console.error("Product not found");
            res.status(404).send("Product not found");
            return;
        }

        const categories = await Category.find();
        res.render("editt-product", { product: product[0], categories, type });
    } catch (err) {
        console.error("Error in loadEditProduct:", err);
        res.status(500).send('/admin/dafsad');
    }
};

//  * edit products

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, price, quantity, status, categoryid, discount, description } = req.body;
        const images = req.files.map(file => file.filename);
        const existingProduct = await Product.findById(id);



        const check = async (image) => {
            if (image) {
                const originalImagePath = path.join(__dirname, `../../public/product_images/${image}`);
                const resizedPath = path.join(__dirname, `../../public/resized_images/${image}`);
                await sharp(originalImagePath)
                    .resize({ height: 1486, width: 1200, fit: 'fill' })
                    .toFile(resizedPath);
                return image;
            } else {
                return null;
            }
        };

        const promises = [];
        for (let index = 0; index < 3; index++) {
            const newImage = images[index];
            const existingImage = existingProduct.img[index];

            const result = newImage ? await check(newImage) : existingImage;
            promises.push(result);
        }

        const img = await Promise.all(promises);

        const updatedProduct = await Product.findByIdAndUpdate(id, {
            name,
            price,
            quantity,
            status,
            img,
            description,
            categoryid,
            discount,
        });

        if (categoryid !== existingProduct.categoryid.toString()) {
            const oldCategory = await Category.findByIdAndUpdate(
                existingProduct.categoryid,
                { $pull: { items: existingProduct._id } }
            );
            const newCategory = await Category.findByIdAndUpdate(
                categoryid,
                { $addToSet: { items: existingProduct._id } }
            );

            if (req.query.type) {
                res.redirect("/admin/catogories");
            } else {
                res.redirect("/admin/products?msg=Product updated successfully");
            }

        } else {
            if (req.query.type) {
                res.redirect("/admin/catogories");
            } else {
                res.redirect("/admin/products?msg=Product updated successfully");
            }
        }


    } catch (err) {
        console.error(err.message);
        res.status(500).send(err);
    }
};

// * for listing  the product
const listProduct = async (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            console.log("Redirecting to /admin/products");
            res.redirect("/admin/products");
            return;
        }
        const product = await Product.findOneAndUpdate({ _id: id }, { $set: { status: "Available" } })
        res.redirect("/admin/products")
    } catch (error) {
        res.status(404).send(error.message)
    }
}

// * for listing  the product
const unlistProduct = async (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            console.log("Redirecting to /admin/products");
            res.redirect("/admin/products");
            return;
        }
        const product = await Product.findOneAndUpdate({ _id: id }, { $set: { status: "Disabled" } })
        res.redirect("/admin/products")

    } catch (error) {
        res.status(404).send(error.message)
    }
}



// * to delete a product

const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const existingProduct = await Product.findById(id);

        await Product.findByIdAndDelete(id);
        await Category.findByIdAndUpdate(existingProduct.categoryid, {
            $pull: { items: id },
        });

        res.redirect("/admin/products?msg=Product deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};




module.exports = {
    loadProducts,
    loadAddProduct,
    loadEditProduct,
    addProduct,
    editProduct,
    deleteProduct,
    listProduct,
    unlistProduct
}