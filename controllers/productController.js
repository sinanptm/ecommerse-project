const adminModel = require("../models/userModels");
const mongoose = require("mongoose")
const sharp = require("sharp")
const path = require("path");
const { log } = require("util");

//  * dashboard loeding

const loadDashBoard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (err) {
    console.log(err.message);
  }
};


//  * product management
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
          discription: "$category.description",
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

//  * add products
const loadAddProduct = async (req, res) => {
  try {
    const msg = req.query.msg;
    const catogories = await adminModel.Category.find();
    res.render("addProducts", { catogories: catogories, msg });
  } catch (error) {
    console.log(error.message);
    res.status(404).json(error.message);
  }
};

// * to add now product

const addProduct = async (req, res) => {
  try {
    const { name, price, quantity, status, categoryid, discount } = req.body;
    const images = req.files.map(file => file.filename);

    const promises = images.map(async (image) => {
      const originalImagePath = path.join(__dirname, '../public/product_images', image);
      const resizedPath = path.join(__dirname, '../public/resized_images', image);
      await sharp(originalImagePath)
        .resize({ height: 1486, width: 1200, fit: 'fill' })
        .toFile(resizedPath);
      return image
    });

    const img = await Promise.all(promises);

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
// * to edit a product

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const type = req.query.type
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
    res.render("editt-product", { product, categories, type });
  } catch (err) {
    console.error("Error in loadEditProduct:", err);
    res.status(500).send("Internal Server Error");
  }
};

//  * edit products

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const { name, price, quantity, status, categoryid, discount } = req.body;

    const images = req.files.map(file => file.filename);

    const existingProduct = await adminModel.Product.findById(id);
    


    const check = async (image) => {
      if (image) {
        const originalImagePath = path.join(__dirname, '../public/product_images', image);
        const resizedPath = path.join(__dirname, '../public/resized_images', image);
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

    const updatedProduct = await adminModel.Product.findByIdAndUpdate(id, {
      name,
      price,
      quantity,
      status,
      img,
      categoryid,
      discount,
    });

    if (categoryid !== existingProduct.categoryid.toString()) {
      const oldCategory = await adminModel.Category.findByIdAndUpdate(
        existingProduct.categoryid,
        { $pull: { items: existingProduct._id } }
      );
      const newCategory = await adminModel.Category.findByIdAndUpdate(
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
    const product = await adminModel.Product.findOneAndUpdate({_id:id},{$set:{status:"Available"}})
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
    const product = await adminModel.Product.findOneAndUpdate({_id:id},{$set:{status:"Disabled"}})
    res.redirect("/admin/products")

  } catch (error) {
    res.status(404).send(error.message)
  }
}



// * to delete a product

const deleteProduct = async (req, res) => {
  try {
    console.log(1);
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


// * for showiing all the catogories

const laodCatagorie = async (req, res) => {
  try {
    const categories = await adminModel.Category.find().populate('items');
    res.render("catogories", { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// * for adding new catogorie

const addCatagorie = async (req, res) => {
  try {
    const { name, description } = req.body;

    const processImage = async (filename) => {
      if (filename) {
        const originalImagePath = path.join(__dirname, '../public/product_images', filename);
        const resizedPath = path.join(__dirname, '../public/resized_images', filename);
        await sharp(originalImagePath)
          .resize({ height: 1486, width: 1200, fit: 'fill' })
          .toFile(resizedPath);
        return filename;
      } else {
        return null;
      }
    };

    const img = await processImage(req.file.filename);

    const newCategory = new adminModel.Category({
      name,
      description,
      img: img,
    });

    const category = await newCategory.save();
    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error adding category:", error);
    req.flash("error", "Internal Server Error. Please try again later.");
    res.redirect("/admin/catogories");
  }
};

// * for editting the catogory
const editCatogory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = req.params.id;

    const existingProduct = await adminModel.Category.findById(id);
    const file = req.file && req.file.filename;
    img = file || existingProduct.img;

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
// * Delte catogotie

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
  loadEditProduct,
  listProduct,
  unlistProduct
};
