const adminModel = require("../models/userModels");
const mongoose = require("mongoose")
// ! dashboard loeding
const loadDashBoard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (err) {
    console.log(err.message);
  }
};

// todo: product management
const loadProducts = async (req, res) => {
  try {
    const msg = req.query.msg
      const products = await adminModel.Product.aggregate([
        {
          $lookup: {
            from: 'categories', 
            localField: 'categoryid',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category', // Unwind the array created by $lookup (as it's a single match)
        },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            quantity: 1,
            status: 1,
            img: 1,
            category: '$category.name', // Rename the category name field
            discription:"$category.description",
            createdate: 1,
            discount: 1,
          },
        },
      ]);
      const categories = await adminModel.Category.find();
      res.render("products-list", { products, categories, msg });
  } catch (err) {
    console.log(err.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, quantity, status, categoryid, discount } = req.body;

    // Handle image updates
    let mainImage = req.files['mainImage'] ? req.files['mainImage'][0].filename : null;
    let backImage = req.files['backImage'] ? req.files['backImage'][0].filename : null;
    let sideImage = req.files['sideImage'] ? req.files['sideImage'][0].filename : null;

    // Retrieve the existing product to get old image filenames
    const existingProduct = await adminModel.Product.findById(id);

    // Retain the old image filenames if new images are not provided
    mainImage = mainImage || existingProduct.img[0];
    backImage = backImage || existingProduct.img[1];
    sideImage = sideImage || existingProduct.img[2];

    const img = [mainImage, backImage, sideImage];

    const updatedProduct = await adminModel.Product.findByIdAndUpdate(id, {
      name,
      price,
      quantity,
      status,
      img,
      categoryid,
      discount,
    });

    const existingCategory = updatedProduct.categoryid;

    // If category is updated, remove product from the old category
    if (existingCategory.toString() !== categoryid.toString()) {
      await adminModel.Category.findByIdAndUpdate(existingCategory, {
        $pull: { items: updatedProduct._id },
      });

      // Add product to the new category
      await adminModel.Category.findByIdAndUpdate(categoryid, {
        $addToSet: { items: updatedProduct._id },
      });
    }

    res.redirect("/admin/products?msg=Product updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


const loadEditProduct = async (req, res) => {
  try {
      const id = req.query.id;

      if (!id) {
          console.log("Redirecting to /admin/products");
          res.redirect("/admin/products");
          return;
      }

      const product = await adminModel.Product
          .findById(id)
          .populate({
              path: 'categoryid',
              model: 'Category',
              select: 'name description' // Adjust the fields as needed
          });
      
      if (!product) {
          console.error("Product not found");
          res.status(404).send("Product not found");
          return;
      }

      const categories = await adminModel.Category.find();
      res.render("editt-product", { product, categories });
  } catch (err) {
      console.error("Error in loadEditProduct:", err);
      res.status(500).send("Internal Server Error");
  }
};
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const existingProduct = await adminModel.Product.findById(id);

    await adminModel.Product.findByIdAndDelete(id);
    await adminModel.Category.findByIdAndUpdate(existingProduct.categoryid, {
      $pull: { items: id },
    });

    res.redirect("/admin/products?msg=Product deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


// ! add products
const loadAddProduct = async (req, res) => {
  try {
    const msg =  req.query.msg;
    const catogories = await adminModel.Category.find();
    res.render("addProducts", { catogories: catogories, msg });
  } catch (error) {
    console.log(error.message);
    res.status(404).json(error.message);
  }
};


const addProduct = async (req, res) => {
  try {
    const { name, price, quantity, status, categoryid, discount } = req.body;
    const mainImage = req.files['mainImage'] ? req.files['mainImage'][0].filename : null;
    const backImage = req.files['backImage'] ? req.files['backImage'][0].filename : null;
    const sideImage = req.files['sideImage'] ? req.files['sideImage'][0].filename : null;

    const img = [mainImage, backImage, sideImage].filter(Boolean);

    const product = new adminModel.Product({
      name,
      price,
      quantity,
      status,
      img,
      categoryid,
      createdate: new Date(),
      discount,
    });

    const savedProduct = await product.save();
    await adminModel.Category.findByIdAndUpdate(categoryid, { $push: { items: savedProduct._id } });


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

const laodCatagorie = async (req, res) => {
  try {
    const categories = await adminModel.Category.find().populate('items');
    res.render("catogories", { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addCatagorie = async (req, res) => {
  const { name, description } = req.body;
  
  const newCategory = new adminModel.Category({
    name,
    description,
    img:req.file.filename,
  });
  const category = await newCategory.save();
  res.redirect("/admin/catogories");
};

const editCatogory = async (req, res) => {
  try {
    const { name, img, description } = req.body;
    const id = req.params.id;

    const existingProduct = await adminModel.Category.findById(id);
    const file = req.file.filename
    img = file || existingProduct.img[0];
    const category = await adminModel.Category.updateOne(
      { _id: id },
      {
        $set: {
          name,
          description,
          img,
        },
      }
    );

    if (category) {
      req.flash("success", "catogory details updated successfully.");
    } else {
      req.flash("error", "Failed to update catogory details.");
    }

    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error editing catogory:", error);
    req.flash("error", "Internal Server Error. Please try again later.");
    res.redirect("/admin/catogories");
  }
};

const deleteCatogory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await adminModel.Category.deleteOne({ _id: id });
    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadDashBoard,
  loadProducts,
  loadAddProduct,
  addProduct,
  laodCatagorie,
  addCatagorie,
  editCatogory,
  deleteCatogory,
  editProduct,
  deleteProduct,
  loadEditProduct
};
