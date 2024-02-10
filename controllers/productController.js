const sharp = require("sharp")
const path = require("path");
const puppeteer = require('puppeteer')
const moment = require('moment');
const { Product, Category, Order, CancelationReson } = require("../models/productModel")
const { User } = require("../models/userModels")
const { createHexId, isValidObjectId } = require('../util/validations');
const { name } = require("ejs");

// * to load dashbord


const loadDashBoard = async (re, res) => {
  try {
    const now = moment();
    const startOfMonth = moment().startOf('month'); // Start of the current month
    const endOfMonth = moment().endOf('month'); // End of the current month

    const revenue = await Order.aggregate([{
      $group: {
        _id: null,
        total: { $sum: '$orderAmount' }
      }
    }]);

    const totalorder = await Order.countDocuments();

    const products = await Order.aggregate([
      { $unwind: '$OrderedItems' },
      { $group: { _id: null, total: { $sum: '$OrderedItems.quantity' } } }
    ]);

    const catagery = await Category.countDocuments();
    const availableproducts = await Product.countDocuments();

    const totalproducts = revenue.length > 0 ? products[0].total : 0;
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    const monthlySales = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfMonth.toDate(),
            $lt: endOfMonth.toDate()
          }
        }
      },
      {
        $group: {
          _id: { $month: '$orderDate' }, // Group by month instead of day
          total: { $sum: '$orderAmount' },
          totalOrders: { $sum: 1 } // Count the number of orders
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1,
          totalOrders: 1
        }
      },
      {
        $sort: {
          month: 1 // Sort the result by month if needed
        }
      }
    ]);

    const monthlyUserRegistrations = await User.aggregate([
      {
        $match: {
          createdate: {
            $gte: startOfMonth.toDate(),
            $lt: endOfMonth.toDate()
          },
          is_verified: true
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdate' },
          total: { $sum: 1 },
          users: { $push: { name: '$name', email: '$email', date: '$createdate' } }
        }
      },
      {
        $project: {
          _id: 0,
          day: '$_id',
          total: 1,
          users: 1,
          name: 1
        }
      }
    ]);


    const monthlyProductDetails = await Product.aggregate([
      {
        $match: {
          createdate: {
            $gte: startOfMonth.toDate(),
            $lt: endOfMonth.toDate()
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdate' },
          total: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1,
        }
      },
      {
        $sort: {
          month: 1
        }
      }
    ]);

    const currentMonthSales = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfMonth.toDate(),
            $lt: endOfMonth.toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1
        }
      }
    ]);

    const currentWeekSales = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: moment().subtract(6, 'days').toDate(),
            $lt: now.toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1
        }
      }
    ]);

    const newusers = await User.find({ is_verified: true }).limit(3).sort({ createdate: -1 });
    const mostSaledProducts = await Product.find().limit(6).sort({ sales: -1 });

    res.render('dashboard', {
      availableproducts,
      totalproducts,
      totalRevenue,
      totalorder,
      catagery,
      currentWeekSales,
      monthlySales,
      monthlyUserRegistrations,
      monthlyProductDetails,
      currentMonthSales,
      newusers,
      mostSaledProducts
    });

  } catch (error) {
    console.log(error.message);
  }
};






//  * product management
const loadProducts = async (req, res) => {
  try {
    const sort = req.query.sort || 'all';
    const name = req.query.name || '';
    const sort2 = req.query.sort2 || 'all';
    const perPage = 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;
    const catogories  = await Category.find();

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
      .skip(skip)
      .limit(perPage);

    const count = await Product.countDocuments(findQuery);
    const totalPages = Math.ceil(count / perPage);
    res.render("products-list", { products, totalPages, currentPage: page, count, sort, catogories , sort2, name }); // Passing data to template
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
      const originalImagePath = await path.join(__dirname, `../public/product_images/${image}`);
      const resizedPath = path.join(__dirname, `../public/resized_images/${image}`);
      await sharp(originalImagePath)
        .resize({ height: 1486, width: 1200, fit: 'fill' })
        .toFile(resizedPath);
      return image
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
      { $match: { _id: await createHexId(id) } },
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
        const originalImagePath = await path.join(__dirname, `../public/product_images/${image}`);
        const resizedPath = path.join(__dirname, `../public/resized_images/${image}`);
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
    console.log(1);
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


// * for showiing all the catogories
const laodCatagorie = async (req, res) => {
  try {
    const sort = req.query.sort || 'default';
    const name = req.query.name || ''
    const perPage = 4;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;

    let sortQuery = [];

    switch (sort) {
      case 'newness':
        sortQuery = [{ $sort: { createdate: -1 } }];
        break;

      case 'less_products':
        sortQuery = [{ $project: { name: 1, description: 1, items: 1, img: 1, sales: 1, numItems: { $size: "$items" } } }, { $sort: { numItems: 1 } }];
        break;

      case 'most_products':
        sortQuery = [{ $project: { name: 1, description: 1, items: 1, img: 1, sales: 1, numItems: { $size: "$items" } } }, { $sort: { numItems: -1 } }];
        break;


      case 'less_saled':
        sortQuery = [{ $sort: { sales: 1 } }];
        break;

      case 'most_saled':
        sortQuery = [{ $sort: { sales: -1 } }];
        break;

      default:
        break;
    }

    if (name !== '') {
      sortQuery.unshift({ $match: { name: { $regex: name, $options: 'i' } } });
    }
    

    const categories = await Category.aggregate([
      ...sortQuery,
      { $skip: skip },
      { $limit: perPage }
    ]);

    const count = await Category.countDocuments({name:{ $regex: name, $options: 'i' }} );
    const totalPages = Math.ceil(count / perPage);


    res.render("catogories", { categories, totalPages, currentPage: page, count, sort, name });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// * for adding new catogorie

const addCatagorie = async (req, res) => {
  try {
    const { name, description, type } = req.body;

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

    const newCategory = new Category({
      name,
      description,
      img: img,
      type,
      createdate: Date.now()
    });

    const category = await newCategory.save();
    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error adding category:", error);
    console.log("error", "Internal Server Error. Please try again later.");
    res.redirect("/admin/catogories");
  }
};

// * for editting the catogory
const editCatogory = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const id = req.params.id;

    const existingProduct = await Category.findById(id);
    const file = req.file && req.file.filename;
    img = file || existingProduct.img;

    const category = await Category.updateOne(
      { _id: id },
      {
        $set: {
          name,
          description,
          img,
          type,
        }
      }
    );

    if (!category) {
      console.log("error", "Failed to update catogory details.");
    }

    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error editing catogory:", error);
    console.log("error", "Internal Server Error. Please try again later.");
    res.redirect("/admin/catogories");
  }
};

// * Delte catogotie

const deleteCatogory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.deleteOne({ _id: id });
    res.redirect("/admin/catogories");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
};


// * for laoding all the orders
const loadOrders = async (req, res) => {
  try {
    const sort = req.query.sort || 'all';
    const sort2 = req.query.sort2 || 'all';
    const perPage = 9;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;

    let findQuery = {};
    if (sort !== 'all') {
      findQuery.orderStatus = sort;
    }

    if (sort2 === 'online') {
      findQuery.offlinePayment = false;
    } else if (sort2 === 'offline') {
      findQuery.offlinePayment = true;
    } else if (sort2 === 'pending') {
      findQuery.paymentStatus = 'pending';
    }

    const countPromise = sort === 'all' ? Order.countDocuments() : Order.countDocuments(findQuery);
    const [count, orders] = await Promise.all([countPromise, Order.find(findQuery).skip(skip).limit(perPage)]);

    const totalPages = Math.ceil(count / perPage);

    res.status(200).render('orders-list', { orders, totalPages, currentPage: page, count, sort, sort2 });
  } catch (error) {
    console.error('Error loading orders:', error.message);
    res.status(500).send('Internal Server Error');
  }
};





// * for deleting a order

const loadOrder = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(304).redirect('/admin/orders-list');
    }

    const order = await Order.findById(id)

    res.render('order-details', { order });

  } catch (error) {
    res.redirect("/admin/orders")
    console.log(error.message);
  }
};



// * for editting a order 
const editOrder = async (req, res) => {
  try {
    const id = req.params.id
    if (!id) {
      return res.status(304).redirect('/admin/order-details?id=' + id)
    }
    const status = req.body.status
    const order = await Order.findByIdAndUpdate(id, { $set: { orderStatus: status } })
    if (!order) {
      console.log('no order to edit');
      return res.status(304).redirect('/admin/order-details?id=' + id)
    }

    res.status(200).redirect('/admin/order-details?id=' + id)

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}


// * for deleting a order

const deleteOrder = async (req, res) => {
  try {
    const id = req.query.id
    if (!id) {
      console.log('no id ');
      return res.status(304).redirect('/admin/orders-list')
    }
    const order = await Order.findById(id);
    if (!order) {
      console.log('no order');
      return res.status(304).redirect('/admin/orders-list')
    }
    await Order.findByIdAndDelete(id);
    res.status(200).redirect('/admin/orders-list')
  } catch (error) {
    console.log(error.message);
    res.status(400).redirect('/admin/orders-list')
  }
}




const loadReport = async (req, res) => {
  try {
    const type = req.params.type;
    if (!type || type !== 'weekly' || type !== "monthly") {

    }

    let reportData;
    let products;
    let categories;

    const orderCancels = await CancelationReson.countDocuments();
    const totalOrders = await Order.countDocuments();


    if (type === 'monthly') {
      const currentMonth = moment().month() + 1;

      const revenueData = await Order.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$orderDate" }, currentMonth] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$orderAmount" } } }
      ]);

      const newProductsData = await Product.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$createdate" }, currentMonth] } } },
        { $count: "count" }
      ]);

      const newUsersData = await User.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$createdate" }, currentMonth] } } },
        { $count: "count" }
      ]);

      const newCategoriesData = await Category.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$createdate" }, currentMonth] } } },
        { $count: "count" }
      ]);

      reportData = {
        type: "Monthly",
        totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
        newProducts: newProductsData.length > 0 ? newProductsData[0].count : 0,
        newUsers: newUsersData.length > 0 ? newUsersData[0].count : 0,
        newCategories: newCategoriesData.length > 0 ? newCategoriesData[0].count : 0,
        cancelledOrders: orderCancels,
        totalOrders: totalOrders,
      };

      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      products = await Product.find({ createdate: { $gte: startOfMonth, $lte: endOfMonth } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
      categories = await Category.find({ createdate: { $gte: startOfMonth, $lte: endOfMonth } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });

    } else if (type === 'weekly') {
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');

      const revenueData = await Order.aggregate([
        { $match: { orderDate: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() } } },
        { $group: { _id: null, totalRevenue: { $sum: "$orderAmount" } } }
      ]);

      const newProductsData = await Product.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek.toDate()] }, { $lte: ["$createdate", endOfWeek.toDate()] }] } } },
        { $count: "count" }
      ]);

      const newCategoriesData = await Category.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek.toDate()] }, { $lte: ["$createdate", endOfWeek.toDate()] }] } } },
        { $count: "count" }
      ]);

      const newUsersData = await User.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek.toDate()] }, { $lte: ["$createdate", endOfWeek.toDate()] }] } } },
        { $count: "count" }
      ]);

      reportData = {
        type: "Weekly",
        totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
        newProducts: newProductsData.length > 0 ? newProductsData[0].count : 0,
        newUsers: newUsersData.length > 0 ? newUsersData[0].count : 0,
        cancelledOrders: orderCancels,
        totalOrders: totalOrders,
        newCategories: newCategoriesData.length > 0 ? newCategoriesData[0].count : 0
      };

      products = await Product.find({ createdate: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
      categories = await Category.find({ createdate: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
    }

    const paymentPendingOrders = totalOrders - (await Order.find({ paymentStatus: 'pending' })).length

    const orders = await Order.find({ orderDate: { $gte: moment().subtract(1, 'day').startOf('day') } });

    const bestProducts = await Product.find().sort({ sales: -1 }).limit(5)
    const bestCatogories = await Category.find().sort({ sales: -1 }).limit(5)

    res.render('report', { reportData, products, categories, bestCatogories, bestProducts, paymentPendingOrders, orders });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getSalesReport = async (req, res) => {
  try {
    const type = req.params.type
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(`${req.protocol}://${req.get("host")}` + `/admin/sales-report/${type}`, {
      waitUntil: 'networkidle2',
    });
    await page.setViewport({ width: 1680, height: 1050 });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
    });

    await browser.close();

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length
    });

    // Send the PDF data as the response body
    res.send(pdf);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}




module.exports = {
  loadDashBoard,
  loadProducts,
  loadAddProduct,
  laodCatagorie,
  loadOrders,
  loadOrder,
  loadEditProduct,
  addProduct,
  addCatagorie,
  editCatogory,
  deleteCatogory,
  editProduct,
  deleteProduct,
  listProduct,
  unlistProduct,
  deleteOrder,
  editOrder,
  loadReport,
  getSalesReport
};
