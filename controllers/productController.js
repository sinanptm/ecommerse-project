const sharp = require("sharp")
const path = require("path");
const exceljs = require("exceljs")
const puppeteer = require('puppeteer')
const { Product, Category, Order, CancelationReson } = require("../models/productModel")
const { User } = require("../models/userModels")
const { createHexId } = require('../util/validations');

// * to load dashbord

const loadDashBoard = async (re, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of the current monthF

    const revenue = await Order.aggregate([{

      $group: {
        _id: null,
        total: { $sum: '$orderAmount' }
      }

    }])

    const totalorder = await Order.countDocuments()

    const products = await Order.aggregate([
      { $unwind: '$OrderedItems' },
      { $group: { _id: null, total: { $sum: '$OrderedItems.quantity' } } }
    ])

    const catagery = await Category.countDocuments()
    const availableproducts = await Product.countDocuments()

    const totalproducts = revenue.length > 0 ? products[0].total : 0;
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    const monthlySales = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfMonth,
            $lt: endOfMonth
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
            $gte: startOfMonth,
            $lt: endOfMonth
          }
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
            $gte: startOfMonth,
            $lt: endOfMonth
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
            $gte: startOfMonth,
            $lt: endOfMonth
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
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
            $lt: now
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


    const newusers = await User.find({ is_verified: true }).limit(3).sort({ createdate: -1 })
    const mostSaledProducts = await Product.find().limit(6).sort({ sales: -1 })



    res.render('dashboard', { availableproducts, totalproducts, totalRevenue, totalorder, catagery, currentWeekSales, monthlySales, monthlyUserRegistrations, monthlyProductDetails, currentMonthSales, newusers, mostSaledProducts })

  } catch (error) {
    console.log(error.message);
  }
}






//  * product management
const loadProducts = async (req, res) => {
  try {
    const perPage = 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;

    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryid',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          quantity: 1,
          status: 1,
          img: 1,
          category: '$category.name',
          discription: "$category.description",
          createdate: 1,
          discount: 1,
        },
      },
    ]).skip(skip).limit(perPage);
    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / perPage);
    res.render("products-list", { products, totalPages, currentPage: page });
  } catch (err) {
    console.log(err.message);
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
      const resizedPath = path.join(__dirname, `../public/resized_images/${image}` );
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
        const resizedPath = path.join(__dirname, `../public/resized_images/${image}` );
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
    const perPage = 4;
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * perPage
    const categories = await Category.find().skip(skip).limit(perPage)
    const count = await Category.countDocuments();
    const totalPages = Math.ceil(count / perPage)
    res.render("catogories", { categories, totalPages, currentPage: page });
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
    req.flash("error", "Internal Server Error. Please try again later.");
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
          type
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
    const perPage = 4;
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * perPage
    const count = await Order.countDocuments()
    const totalPages = Math.ceil(count / perPage)
    const orders = await Order.find().populate('deliveryAddress').skip(skip).limit(perPage)
    res.render(`orders-list`, { orders, totalPages, currentPage: page });

  } catch (error) {
    console.log(error.message);
  }
}



// * for deleting a order

const loadOrder = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(304).redirect('/admin/orders-list');
    }

    const order = await Order.aggregate([
      { $match: { _id: await createHexId(id) } },
      {
        $lookup: {
          from: 'users', // Assuming 'users' is the name of your user collection
          localField: 'userid',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'addresses', // Assuming 'addresses' is the name of your address collection
          localField: 'deliveryAddress',
          foreignField: '_id',
          as: 'deliveryAddress'
        }
      },
      { $unwind: "$user" },
      { $unwind: "$deliveryAddress" },
      {
        $project: {
          _id: 1,
          orderAmount: 1,
          orderDate: 1,
          orderStatus: 1,
          deliveryDate: 1,
          ShippingDate: 1,
          payment: 1,
          online_payment: 1,
          offlinePayment: 1,
          paymentStatus: 1,
          'user.email': 1,
          'user.username': 1,
          'user.name': 1,
          'user.gender': 1,
          'user.phone': 1,
          'user.createdate': 1,
          'user.updated': 1,
          'user.is_verified': 1,
          'user.status': 1,
          'deliveryAddress.Fname': 1,
          'deliveryAddress.Lname': 1,
          'deliveryAddress.companyName': 1,
          'deliveryAddress.country': 1,
          'deliveryAddress.streetAdress': 1,
          'deliveryAddress.city': 1,
          'deliveryAddress.state': 1,
          'deliveryAddress.pincode': 1,
          'deliveryAddress.mobile': 1,
          'deliveryAddress.email': 1,
        }
      }
    ]);

    if (!order || order.length === 0) {
      return res.status(304).redirect('/admin/orders-list');
    }

    res.render('order-details', { order: order[0] });

  } catch (error) {
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


const creatOrderReport = async (req, res) => {
  try {
    const orders = await Order.find().populate("deliveryAddress");
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "S no", key: "S_no" },
      { header: "Name", key: "name" },
      { header: "Email ID", key: "email" },
      { header: "Mobile", key: "mobile" },
      { header: "Order Amount", key: "orderAmount" },
      { header: "Order Date", key: "orderDate" },
      { header: "Order Status", key: "orderStatus" },
      { header: "Payment Status", key: "paymentStatus" },
      { header: "Payment Method", key: "paymentMethod" }, // Fixed typo in key name
    ];

    orders.forEach((order, index) => {
      let orderStatus = () => {
        if (order.orderStatus === '1') {
          return "Processing";
        } else if (order.orderStatus === '2') {
          return 'Quality Check';
        } else if (order.orderStatus === "3") {
          return "Shipped";
        } else if (order.orderStatus === '4') {
          return 'Delivered';
        }
      };

      // Additional error handling for orderDate
      let orderDateString = "";
      if (order.orderDate instanceof Date) {
        orderDateString = order.orderDate.toLocaleString('en-IN');
      } else {
        console.error(`Invalid orderDate for order at index ${index}: ${order.orderDate}`);
      }

      worksheet.addRow({
        S_no: index + 1,
        name: order.deliveryAddress?.Lname || "",
        email: order.deliveryAddress?.email || "",
        mobile: order.deliveryAddress?.mobile || "",
        orderAmount: order.orderAmount || "",
        orderDate: orderDateString || "",
        orderStatus: orderStatus(),
        paymentStatus: order.paymentStatus || "",
        paymentMethod: order.offlinePayment ? "Cash on Delivery" : "Online Payment",
      });
    });


    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Orders_report.xlsx"');

    await workbook.xlsx.write(res);

    res.status(200).end();

  } catch (error) {
    console.error(error.message);
    res.status(500).redirect('/admin/dashboard');
  }
};




const sales_reportXL = async (req, res) => {
  try {
    const type = req.params.type;
    let reportData;

    // Count the number of cancellation reasons and total orders
    const orderCancels = await CancelationReson.countDocuments();
    const totalOrders = await Order.countDocuments();

    let products; // Declare products variable outside of the if block
    let categories; // Declare categories variable outside of the if block

    // ! monthly report
    if (type === 'monthly') {
      // Get the current month
      const currentMonth = new Date().getMonth() + 1;

      // Aggregate total revenue for the current month
      const revenueData = await Order.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$orderDate" }, currentMonth] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$orderAmount" } } }
      ]);

      // Aggregate new products created in the current month
      const newProductsData = await Product.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$createdate" }, currentMonth] } } },
        { $count: "count" }
      ]);

      // Aggregate new users registered in the current month
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

      // Fetch all new products and their sales for the current month
      const startOfMonth = new Date(new Date().getFullYear(), currentMonth - 1, 1);
      const endOfMonth = new Date(new Date().getFullYear(), currentMonth, 0);
      products = await Product.find({ createdate: { $gte: startOfMonth, $lte: endOfMonth } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
      categories = await Category.find({ createdate: { $gte: startOfMonth, $lte: endOfMonth } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });

      // ! Weekly report 
    } else if (type === 'weekly') {
      // Get the start and end dates of the current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      // Aggregate total revenue for the current week
      const revenueData = await Order.aggregate([
        { $match: { orderDate: { $gte: startOfWeek, $lte: endOfWeek } } },
        { $group: { _id: null, totalRevenue: { $sum: "$orderAmount" } } }
      ]);

      // Count new products created in the current week
      const newProductsData = await Product.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek] }, { $lte: ["$createdate", endOfWeek] }] } } },
        { $count: "count" }
      ]);

      const newCategoriesData = await Category.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek] }, { $lte: ["$createdate", endOfWeek] }] } } },
        { $count: "count" }
      ]);

      // Count new users registered in the current week
      const newUsersData = await User.aggregate([
        { $match: { $expr: { $and: [{ $gte: ["$createdate", startOfWeek] }, { $lte: ["$createdate", endOfWeek] }] } } },
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

      // Fetch all new products and their sales for the current week
      products = await Product.find({ createdate: { $gte: startOfWeek, $lte: endOfWeek } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
      categories = await Category.find({ createdate: { $gte: startOfWeek, $lte: endOfWeek } }, { _id: 0, sales: 1, name: 1 }).sort({ sales: -1 });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Type", key: "type", width: 15 },
      { header: "Total Revenue", key: "totalRevenue", width: 15 },
      { header: "Products added", key: "newProducts", width: 10 },
      { header: "New Products", key: "products", width: 15 },
      { header: "Sales", key: "pSales", width: 5 },
      { header: "Categories added", key: "newCategories", width: 10 },
      { header: "New Categories", key: "categories", width: 15 }, // Corrected key name
      { header: "Sales", key: "cSales", width: 5 },
      { header: "New Users", key: "newUsers", width: 25 },
      { header: "Cancelled Orders", key: "cancelledOrders", width: 15 },
      { header: "Total Orders", key: "totalOrders", width: 15 },
    ];

    worksheet.addRow(reportData);
    if (products && products.length > 0) {
      products.forEach((product) => {
        worksheet.addRow({ newProducts: product.name, pSales: product.sales }); // Corrected key name
      });
    } else {
      worksheet.addRow({ newProducts: 0, pSales: 0 }); // Corrected key name
    }
    if (categories && categories.length > 0) {
      categories.forEach((category) => {
        worksheet.addRow({ newCategories: category.name, cSales: category.sales }); // Corrected key name
      });
    } else {
      worksheet.addRow({ newCategories: 0, cSales: 0 }); // Corrected key name
    }



    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    worksheet.getRow(1).height = 20;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportData.type}_sales_report.xlsx"`);

    await workbook.xlsx.write(res);

    res.status(200).end();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getReportPDF = async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true }); // Opt-in to the new Headless mode
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3333/home', {
      waitUntil: 'networkidle2',
    });
    await page.setViewport({ width: 1680, height: 1050 });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize:true,

    });

    await browser.close();



    res.download(path.join(__dirname,"../public/salesReports"),(err)=>{
      if (err) {
        console.log(err);
      }
  })
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
  creatOrderReport,
  sales_reportXL,
  getReportPDF
};
