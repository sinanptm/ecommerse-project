const adminModel = require("../models/userModels");
const mongoose = require("mongoose");
const fs = require("fs")


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
    res.render("products-list");
  } catch (err) {
    console.log(err.message);
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
  const catogories = await adminModel.Category.find();
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

module.exports = { addProduct };





// todo: catocory managment
const laodCatagorie = async (req, res) => {
  try {
    const categories = await adminModel.Category.find();
    res.render("catogories", { categories });
  } catch (error) {}
};

const addCatagorie = async (req, res) => {
  const { name, img, description } = req.body;
  const newCategory = new adminModel.Category({
    name,
    description,
    img,
  });
  const category = await newCategory.save();
  res.redirect("/admin/catogories");
};

const editCatogory = async (req, res) => {
  try {
    const { name, img, description } = req.body;
    const id = req.params.id;
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
};
