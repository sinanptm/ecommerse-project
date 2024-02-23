const { Product, Category, Order, CancelationReson, Coupon } = require("../../models/productModel")
const { User } = require("../../models/userModels")
const { isValidObjectId } = require('../../util/validations');
const { puppeteer, moment } = require("../../util/modules");
const { JsonWebTokenError } = require("jsonwebtoken");


// * to load dashbord


const loadDashBoard = async (req, res) => {
  try {
    const reportErr = req.query.report
    const now = moment();
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

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
          month: 1
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
    const mostSaledProducts = await Product.find().limit(10).sort({ sales: -1 });
    const mostSaledCatogories = await Category.find().limit(10).sort({ sales: -1 });
    const cancelationReson = await CancelationReson.find().limit(4).sort();


    res.render('dashboard', {
      availableproducts,
      totalproducts,
      totalRevenue,
      totalorder,
      catagery,
      currentWeekSales,
      monthlySales,
      monthlyProductDetails,
      currentMonthSales,
      newusers,
      mostSaledProducts,
      mostSaledCatogories,
      cancelationReson,
      reportErr
    });

  } catch (error) {
    console.log(error.message);
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
      findQuery.online_payment = { $exists: true };
    } else if (sort2 === 'offline') {
      findQuery.offlinePayment = { $exists: true };
    } else if (sort2 === 'wallet') {
      findQuery.walletPayment = { $exists: true };
    }

    const countPromise = sort === 'all' ? Order.countDocuments() : Order.countDocuments(findQuery);
    const [count, orders] = await Promise.all([countPromise, Order.find(findQuery).sort({ orderDate: -1 }).skip(skip).limit(perPage)]);

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
    const order = await Order.findById(id).lean()

    let paymentType = '';
    if (order.offlinePayment) {
      paymentType = 'offline'
    } else if (order.walletPayment) {
      paymentType = 'wallet'
    } else if (!order.online_payment && order.paymentStatus === 'pending') {
      paymentType = 'online_pending'
    } else if (order.online_payment) {
      paymentType = 'online'
    } else {
      paymentType = 'Not Available'
    }

    const reason = await CancelationReson.findOne({ orderid: order._id }, { _id: 0, reason: 1 })

    let actualPrice = 0;
    let discountPrice = 0;

    for (const product of order.OrderedItems) {
      actualPrice += product.price * product.quantity;
      discountPrice += product.price * product.quantity * (1 - product.discount / 100);
    }

    let couponDiscountBefore = discountPrice;

    let couponDiscount = order.coupon ? (discountPrice * (order.coupon / 100)) : 0;

    let minusedAmount = couponDiscountBefore - (discountPrice - couponDiscount);



    res.render('order-details', {
      order: order,
      reason: reason,
      paymentType: paymentType,
      actualPrice: actualPrice,
      coupon: order.coupon,
      couponDiscount: couponDiscount,
      discountPrice: discountPrice,
      minusedAmount
    });

  } catch (error) {
    res.redirect("/admin/orders-list")
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


// * for loading the report page 
const loadReport = async (req, res) => {
  try {
    let type = req.params.type;
   

    if (!type || (type !== 'weekly' && type !== 'monthly' && type !== 'custom')) {
      res.redirect("/admin/dashboard");
      return;
    }

    let start;
    let end;
    let filteringTime;
    let profit = 0;

    if (type === 'custom') {
      const range = JSON.parse(req.query.range);
      const startDate = moment(range.start_date);
      const endDate = moment(range.end_date);    

      if (!startDate.isValid() || !endDate.isValid()) {
        res.status(400).json({ error: "Invalid date format" });
        return;
      }

      start = startDate.startOf('day');
      end = endDate.endOf('day');

      type = "Custom";
      filteringTime = `Custom Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`;
    } else if (type === 'monthly') {
      type = "Monthly";
      start = moment().startOf('month');
      end = moment().endOf('month');
      filteringTime = `Monthly Report: ${start.format('MMMM YYYY')}`;
    } else if (type === 'weekly') {
      type = "Weekly";
      start = moment().startOf('week');
      end = moment().endOf('week');
      filteringTime = `Weekly Report: ${start.format('MMM DD, YYYY')} to ${end.format('MMM DD, YYYY')}`;
    } else {
      type = "Custom";
      start = moment().startOf('day');
      end = moment().endOf('day');
      filteringTime = `Daily Report: ${start.format('YYYY-MM-DD')}`;
    }

    const orders = await Order.find({ orderStatus: '4', orderDate: { $gte: start, $lte: end } }).populate("userid");

    orders.forEach(order => {
      profit += order.orderAmount; // Accumulate profit from each order
    });

    res.render('report', { orders, filteringTime, type, profit });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



// * for downlaoding the the report 

const getSalesReport = async (req, res) => {
  try {
    const type = req.params.type
    let range = {}
    if (type == 'custom') {
      range = {
        start_date: req.body.start_date,
        end_date: req.body.end_date
      }
      range = JSON.stringify(range)
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(`${req.protocol}://${req.get("host")}` + `/admin/sales-report/${type}?range=${range}`, {
      waitUntil: 'networkidle2',
    });
    await page.setViewport({ width: 1680, height: 1050 });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length
    });

    res.send(pdf);
  } catch (error) {
    console.error(error.message);
    res.status(304).redirect("/admin/dashboard?report=false")
  }
}

// * for liading the coupons page 

const loadCoupons = async (req, res) => {
  try {
    // ? for deleting the expired coupon 
    await Coupon.deleteMany({ expDate: { $lt: Date.now() } })
    const coupons = await Coupon.find()

    res.render('coupon', { coupons })
  } catch (error) {
    console.log(error.message);
  }
}

// * for adding a new coupon 

const addCoupon = async (req, res) => {
  try {
    const { name, discount, expiry, code, max } = req.body;

    const newCoupon = new Coupon({
      code,
      name,
      maxAmount: max ? max : 0,
      discAmt: discount,
      expDate: new Date(expiry),
      createdate: new Date()
    });

    await newCoupon.save();

    res.status(201).redirect('/admin/coupon-managment');

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// * for deleting coupons 

const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id

    if (isValidObjectId(id)) {
      var data = await Coupon.findByIdAndDelete(id)
    } else {
      res.status(400).json({ succuss: false, message: 'coupon not found' })
    }

    if (data) {
      res.status(200).json({ succuss: true })
    } else {
      res.status(400).json({ succuss: false, message: 'coupon not found' })
    }
  } catch (error) {
    res.status(400).redirect('/admin/coupon-managment')
    console.log("error in delteing coupon");
  }

}

// * for editting coupon

const editCoupon = async (req, res) => {
  try {

    const id = req.query.id
    const { name, discount, expiry, code } = req.body;
    if (isValidObjectId(id)) {
      var update = await Coupon.findByIdAndUpdate(id, {
        name,
        discount,
        expDate: new Date(expiry),
        code
      })
    }
    else {
      throw new Error('id is not okay ')
    }

    if (update) {
      res.status(200).redirect('/admin/coupon-managment')
    }

  } catch (error) {
    res.status(400).redirect('/admin/coupon-managment')
    console.log(error.message);
  }
}


module.exports = {
  loadDashBoard,
  loadOrders,
  loadOrder,
  deleteOrder,
  editOrder,
  loadReport,
  getSalesReport,
  loadCoupons,
  addCoupon,
  deleteCoupon,
  editCoupon
};
