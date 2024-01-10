const adminModel = require("../models/userModels");
const mongoose = require("mongoose");

// ! dashboard loeding
const loadDashBoard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (err) {
    console.log(err.message);
  }
};

// ! product list
const loadProducts = async (req, res) => {
  try {
    res.render("products-list");
  } catch (err) {
    console.log(err.message);
  }
};

// ! catocory managment
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
  laodCatagorie,
  addCatagorie,
  editCatogory,
  deleteCatogory,
};
