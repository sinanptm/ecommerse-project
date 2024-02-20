const { Cart, User, Wishlist, Addresse, Wallet } = require("../../models/userModels");
const { Product, Order, Category, Coupon } = require("../../models/productModel");
const { getUserIdFromToken, createHexId, isValidObjectId } = require("../../util/validations");
const { crypto, Razorpay } = require("../../util/modules")


// * for adding new items to the cart

const addToCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { productid, quantity } = req.body;
    quantity = Number(quantity || "1")
    const userId = await getUserIdFromToken(token);
    const user = await User.findById(userId)
    if (!user) {
      res.status(304).redirect('/login?toast=to add a product to cart you should register first')
      return
    }
    const userCart = await Cart.findOne({ userId });
    const product = await Product.findById(productid);


    if (product.quantity <= 0) {
      res.status(400).json({ stock: false })
      return;
    }

    const totalPrice = product.price * quantity;

    if (userCart) {
      const existingProductIndex = userCart.products.findIndex(
        (item) => item.productid.toString() === productid
      );

      if (existingProductIndex !== -1) {
        userCart.products[existingProductIndex].quantity += quantity;

        userCart.markModified('products');
      } else {
        // Add the product to the cart if it doesn't exist
        userCart.products.push({
          productid: productid,
          quantity: quantity || 1,
        });
      }

      userCart.items = userCart.products.length; // Set the total items based on the unique products

      const updatedCart = await userCart.save();
    } else {
      // Create a new cart if the user doesn't have one
      const cart = new Cart({
        products: [{
          productid: productid,
          quantity: quantity || 1,
        }],
        totalPrice: totalPrice,
        items: 1, // Since it's a new cart, there is one unique product
        userId: userId,
        createdate: new Date(),
      });

      const newCart = await cart.save();
    }
    if (req.body.wish) {
      const whish = await Wishlist.updateOne({ userid: userId }, { $pull: { products: productid } })
      res.status(200).redirect("/whishlist")
      return
    } else {
      res.status(200).redirect("/product?id=" + productid);
      return
    }

  } catch (error) {
    console.error("error in adding to cart" + error);
    res.status(500).redirect("/products"); // Handle other errors with a 500 status and redirect
  }
};



const addToCartProductPage = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { id, } = req.query;
    const productid = id;
    let quantity = '1';
    quantity = Number(quantity)
    const userId = await getUserIdFromToken(token);
    const userCart = await Cart.findOne({ userId });
    const product = await Product.findById(productid);

    if (product.quantity <= 0) {
      res.status(400).redirect("/products");
      return;
    }

    const totalPrice = product.price * quantity;

    if (userCart) {
      const existingProductIndex = userCart.products.findIndex(
        (item) => item.productid.toString() === productid
      );

      if (existingProductIndex !== -1) {
        // Update the quantity if the product already exists in the cart
        userCart.products[existingProductIndex].quantity += quantity;

        userCart.markModified('products');
      } else {
        // Add the product to the cart if it doesn't exist
        userCart.products.push({
          productid: productid,
          quantity: quantity,
        });
      }

      userCart.items = userCart.products.length; // Set the total items based on the unique products

      const updatedCart = await userCart.save();
    } else {
      // Create a new cart if the user doesn't have one
      const cart = new Cart({
        products: [{
          productid: productid,
          quantity: quantity,
        }],
        totalPrice: totalPrice,
        items: 1, // Since it's a new cart, there is one unique product
        userId: userId,
        createdate: new Date(),
      });

      const newCart = await cart.save();
    }
    if (req.query.ss) {
      res.status(200).redirect('/home')
    } else {
      res.status(200).redirect("/products");
    }


  } catch (error) {
    console.error(error);
    res.status(500).redirect("/products"); // Handle other errors with a 500 status and redirect
  }
};

// * for loading the cart page 

const loadCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    if (!token) {
      return res.render("cart", { products: [], cart: { items: 0 }, productsToCheckout: { productid: 0, quantity: 0 }, toast: req.query.toast, totalPrice: 0, outOfStock: [] });
    }

    const userId = await getUserIdFromToken(token);

    let cart = await Cart.findOne({ userId }).populate({
      path: 'products.productid',
      model: 'Product',
    });


    if (!cart) {
      return res.render("cart", { products: [], cart: { items: 0 }, productsToCheckout: { productid: 0, quantity: 0 }, toast: req.query.toast, totalPrice: 0, outOfStock: [] });
    }

    const products = cart.products;

    const totalPrice = products.reduce((total, product) => {
      if (product.quantity > 0 && product.productid.status === "Available") {
        return total + product.productid.price * product.quantity;
      }
      return total;
    }, 0);

    const filteredProducts = products.filter(product => product.productid.quantity > 0 && product.productid.status === "Available");
    const productsToCheckout = filteredProducts.map(product => ({ productid: product.productid._id, quantity: product.quantity }));

    let outOfStock = [];

    for (const product of productsToCheckout) {
      const p = await Product.findById(product.productid);
      if (p.quantity <= 0 || p.quantity - product.quantity <= 0) {
        outOfStock.push({ name: p.name, remainingQuantity: p.quantity });
      }
    }

    return res.render("cart", { products, cart, totalPrice, productsToCheckout, toast: req.query.toast, outOfStock });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};


// * ror adding quantity of a product

const addQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const userid = await getUserIdFromToken(req.cookies.token || req.session.token);
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId: userid.toString() });

    if (!cart) {
      console.error('Cart not found for userid:', userid);
      res.status(404).redirect('/cart');
      return;
    }

    const productIndex = cart.products.findIndex(product => product.productid.equals(productId));

    if (productIndex === -1) {
      console.error('Product not found in the cart:', productId);
      res.status(404).redirect('/cart');
      return;
    }

    const quantityChange = quantity - cart.products[productIndex].quantity;

    cart.products[productIndex].quantity = quantity;

    const productPrice = cart.products[productIndex].price * quantityChange;

    cart.totalPrice += productPrice;

    await cart.save();
    res.redirect('/cart');
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/cart');
  }
};

// * for removing product from cart

const removeProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
    const cart = await Cart.findOne({ userId });

    const productIndex = cart.products.findIndex(product => product.productid.equals(productId));
    if (productIndex === -1) {
      console.error('Product not found in the cart:', productId);
      return res.status(404).json({ error: 'Product not found in the cart' });
    }

    const removedProduct = cart.products.splice(productIndex, 1)[0];

    cart.items -= 1;
    cart.totalPrice -= removedProduct.price;
    await cart.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// * for sending datas to checkout page 

const addToCheckout = async (req, res) => {
  try {
    let { totalprice, products, coupons } = req.body;
    const coupon = req.query.coupon;

    if (typeof coupon !== 'undefined' && coupon !== null) {
      var findCoupon = await Coupon.findOne({ code: coupon });

      if (findCoupon) {

        if (findCoupon.expDate && new Date(findCoupon.expDate) < new Date()) {
          res.json({ msg: true });
        } else {
          req.session.coupon = findCoupon.discAmt;
          res.json({ msg: false, couponDiscount: findCoupon.discAmt });
        }
        return;
      } else {
        res.json({ msg: true });
        return;
      }
    }

    if (typeof coupons !== 'undefined' && coupons !== null) {
      await Coupon.updateOne({ code: parseInt(coupons) }, { $inc: { used: 1 } })
    }

    const parsedProducts = Array.isArray(products) ? products : [products];

    req.session.parsedProducts = parsedProducts;
    req.session.totalAmount = totalprice;
    res.locals.products = parsedProducts;
    res.redirect(`/checkout?t=${totalprice}`);
  } catch (error) {
    console.log(error.message);
    res.status(400).redirect('/cart');
  }
};




// * for loading checkout 
const loadCheckout = async (req, res) => {
  try {
    const couponDiscount = req.session.coupon || 0; // in percentage, default to 0 if not set
    const parsedProducts = req.session.parsedProducts;
    const total = req.session.totalAmount;
    const token = req.cookies.token || req.session.token;

    // Check if user is logged in
    if (!token) {
      return res.status(304).redirect('/login');
    }

    const userId = await getUserIdFromToken(token);

    // Verify total amount
    if (total !== req.query.t) {
      return res.status(304).redirect('/cart');
    }

    // Check if total or token is missing
    if (!total || !token) {
      return res.status(302).redirect('/cart');
    }

    let products = parsedProducts;
    try {
      products = JSON.parse(products);
    } catch (error) {
      console.error('Error parsing products:', error.message);
      return res.status(500).redirect('/cart');
    }

    // Get user information and address
    let user = await User.aggregate([
      {
        $match: {
          _id: createHexId(userId)
        }
      },
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "address"
        }
      }
    ]);
    user = user[0];

    if (!user) {
      console.log('No user id');
      return res.status(302).redirect('/cart');
    }

    // Check if there are products in the cart
    if (!Array.isArray(products) || products.length === 0) {
      console.log('No products in the cart');
      return res.status(302).redirect('/cart');
    }

    // Get product IDs
    const productIds = products.map(product => product.productid);
    const populatedProducts = await Product.find({ _id: { $in: productIds } });

    let totalDiscount = 0;
    let subtotal = 0;
    const totalPrices = populatedProducts.map((product, i) => {
      subtotal = product.price * products[i].quantity;
      const discount = product.discount || 0;
      const discountedPrice = (product.price - (product.price * discount / 100)) * products[i].quantity;
      totalDiscount += (product.price * products[i].quantity) - discountedPrice;
      return discountedPrice;
    });

    // Calculate total price and apply coupon discount
    const totalPrice = totalPrices.reduce((acc, curr) => acc + curr, 0);
    const couponDiscountAmount = (totalPrice * couponDiscount) / 100;
    const discountedTotalPrice = totalPrice - couponDiscountAmount;

    let wallet = await Wallet.findOne({ userid: userId }).lean()


    if (wallet == null) {
      wallet = { msg: "No Balance" }
    } else if (wallet.balance < totalPrice) {
      wallet.msg = "No Balance"
    }

    // Render the checkout page with data
    res.render("checkout", {
      wallet,
      user,
      subtotal,
      products,
      totalPrice: discountedTotalPrice, // Total price after applying coupon discount
      totalDiscount,
      couponDiscount,
      parsedProducts,
      couponDiscountAmount, // Pass coupon discount amount to the view
    });

  } catch (error) {
    console.error('Error in loadCheckout:', error.message);
    res.status(500).send('Internal Server Error');
  }
};



// * for placing new order 
const placeOrder = async (req, res) => {
  try {
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
    let { totalprice, products, payment_method, address } = req.body;
    const orderDate = Date.now();
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    products = JSON.parse(products);
    const productIds = products.map(product => product.productid);
    var populatedProducts = await Product.find({ _id: { $in: productIds } });
    
    let outOfStock = [];

    for (const product of products) {
      const p = await Product.findById(product.productid);
      if (p.quantity <= 0 || p.quantity - product.quantity <= 0) {
        outOfStock.push({ name: p.name, remainingQuantity: p.quantity });
      }
    }


    if (outOfStock.length > 0) {
      return res.json({msg:`products are out of stock please try again`,outOfStock:outOfStock})
    }

    // Update the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error("Cart not found for the user");
    }

    const totalItemsToRemove = products.reduce((acc, curr) => acc + curr.quantity, 0);
    if (cart.items < totalItemsToRemove) {
      throw new Error("Insufficient items in the cart");
    }



    const detailsPromises = populatedProducts.map(async (product, i) => {
      await Category.findByIdAndUpdate(product.categoryid, { $inc: { sales: 1 } }); // Assuming sales needs to be incremented by 1
      return {
        productid: product._id,
        price: product.price,
        quantity: products[i].quantity,
        name: product.name
      };
    });
    const details = await Promise.all(detailsPromises);

    address = await Addresse.findById(address)

    const newOrder = new Order({
      userid: userId,
      orderAmount: totalprice,
      paymentStatus: 'pending',
      deliveryAddress: {
        id: address._id,
        Fname: address.Fname,
        Lname: address.Lname,
        userId: address.userId,
        companyName: address.companyName,
        country: address.country,
        streetAdress: address.streetAdress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        mobile: address.mobile,
        email: address.email,
      },
      orderDate,
      orderStatus: "1",
      deliveryDate,
      OrderedItems: details
    });

    let order = await newOrder.save();

    const customer = await User.findById(userId)

    // * cashon delivery 
    if (payment_method == "cod") {
      order.offlinePayment = true;
      await order.save();

      for (const product of populatedProducts) {
        product.quantity -= 1;
        await product.save();
      }

      for (const product of products) {
        const index = cart.products.findIndex(p => p.productid.toString() === product.productid);
        if (index !== -1) {
          cart.products.splice(index, 1);
        } else {
          throw new Error(`Product ${product.productid} not found in the cart`);
        }
      }
      cart.items -= totalItemsToRemove;
      await cart.save();

      res.status(200).json({ status: 200, id: order._id });


      // * online payment 
    } else if (payment_method == 'online_payment') {

      const options = {
        amount: order.orderAmount * 100,
        currency: 'INR',
        receipt: 'razorUser@gmail.com'
      }
      const id = order._id



      razorpayInstance.orders.create(options, (err, order) => {
        if (!err) {

          res.status(200).send({
            success: true,
            msg: 'Order Created',
            order_id: order.id,
            amount: order.orderAmount,
            key_id: process.env.RAZORPAY_KEY,
            contact: customer.phone,
            name: customer.name,
            email: customer.email,
            populatedProducts,
            products,
            totalItemsToRemove,
            id
          });
        }
        else {
          res.status(400).send({ success: false, msg: 'Something went wrong!' });
        }
      }
      );
    } else if (payment_method == 'wallet') {
      const wallet = await Wallet.findOneAndUpdate(
        { userid: userId },
        {
          $inc: { balance: -order.orderAmount },
          $push: {
            transactions: {
              type: 'debit',
              amount: order.orderAmount,
              date: new Date(),
              orderid: order._id
            }
          }
        },
        { new: true }
      );

      order.walletPayment = {
        transactionid: wallet.transactions[wallet.transactions.length - 1]._id,
        date: new Date()
      };

      await order.save();

      for (const product of populatedProducts) {
        product.quantity -= 1;
        await product.save();
      }

      for (const product of products) {
        const index = cart.products.findIndex(p => p.productid.toString() === product.productid.toString());
        if (index !== -1) {
          cart.products.splice(index, 1);
        } else {
          throw new Error(`Product ${product.productid} not found in the cart`);
        }
      }

      cart.items -= totalItemsToRemove;
      await cart.save();

      res.status(200).json({ status: 200, id: order._id });
    }



  } catch (error) {
    console.log(error.message);
    res.status(500).send("Failed to place order: " + error.message);
  }
};

// * for verufying onlin epayment 

const online_payment = async (req, res) => {
  try {
    let { payment, order, } = req.body
    let { totalItemsToRemove, populatedProducts, products, id, } = order

    const userId = await getUserIdFromToken(req.session.token || req.cookies.token)
    const cart = await Cart.findOne({ userId });

    for (const product of populatedProducts) {
      const updatedProduct = await Product.findById(product._id);
      if (!updatedProduct) {
        throw new Error(`Product with ID ${product._id} not found`);
      }
      updatedProduct.quantity -= 1;
      await updatedProduct.save();
    }

    for (const product of products) {
      const index = cart.products.findIndex(p => p.productid.toString() === product.productid);
      if (index !== -1) {
        cart.products.splice(index, 1);
      } else {
        throw new Error(`Product ${product.productid} not found in the cart`);
      }
    }
    cart.items -= totalItemsToRemove;
    await cart.save();

    let paymentOrder = await Order.findById(id)
    if (!payment) {
      res.status(404).json({ fail: true })
    }

    let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
    hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id)
    hmac = hmac.digest('hex')
    if (hmac == payment.razorpay_signature) {
      paymentOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            paymentStatus: "completed",
            online_payment: {
              currency: 'INR',
              status: 'placed',
              transactionid: payment.razorpay_order_id + "|" + payment.razorpay_payment_id,
              createdate: Date.now(),
            }
          }
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ success: true, orderid: paymentOrder._id })

    } else {
      res.status(404).json({ fail: true })
    }



  } catch (error) {
    console.log(error.message);
  }
}


// * to show the order success page

const showSuccess = async (req, res) => {
  try {
    const id = req.query.id

    if (!id || !isValidObjectId(id)) {
      console.log('no orderid');
      return res.status(304).redirect("/cart")
    }


    let order = await Order.aggregate([
      { $match: { _id: createHexId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "userid",
          foreignField: "_id",
          as: "userid"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "OrderedItems.productid",
          foreignField: "_id",
          as: "OrderedItems"
        }
      }
    ])
    order = order[0]

    if (!order || Date.now() - order.orderDate > 300000) {
      return res.status(304).redirect("/account");
    }

    await Promise.all(order.OrderedItems.map(async (product) => {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { sales: 1 } }
      );
    }));

    res.render('order-success', { order })

  } catch (error) {
    console.log(error.message);
  }
}


// * whishlist 

const loadWhishList = async (req, res) => {
  try {
    const userid = await getUserIdFromToken(req.cookies.token || req.session.token);

    const existingWishlist = await Wishlist.findOne({ userid });

    if (existingWishlist) {
      const products = await Product.find({ _id: { $in: existingWishlist.products } });
      res.render("wishlist", { products });
    } else {
      res.render("wishlist", { products: [] });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const addToWhishlist = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      res.status(400).redirect('/products')
    } else {
      const p = await Product.findById(id);
      if (!p) {
        res.status(404).redirect('/products')
      }
    }
    const userid = await getUserIdFromToken(req.cookies.token || req.session.token)
    const userWhish = await Wishlist.findOne({ userid });
    if (userWhish) {
      userWhish.products.push(id)
      await userWhish.save()
    } else {
      const newWhish = new Wishlist({
        products: [id],
        userid
      });
      await newWhish.save()
    }
    res.status(200).redirect('/products')

  } catch (error) {
    console.log(error.message);
  }
}

const removeFromWhishlist = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      res.status(400).redirect('/products')
    } else {
      const p = await Product.findById(id);
      if (!p) {
        res.status(404).redirect('/products')
      }
    }
    const userid = await getUserIdFromToken(req.cookies.token || req.session.token)

    const updateResult = await Wishlist.updateOne(
      { userid },
      { $pull: { products: id } }
    );

    if (req.query.ss) {
      res.status(200).redirect("/whishlist")
    } else {
      res.status(200).redirect('/products');

    }


  } catch (error) {
    console.log(error.message);
  }
}





module.exports = {
  loadCart,
  addToCart,
  addQuantity,
  removeProduct,
  loadCheckout,
  addToCheckout,
  placeOrder,
  online_payment,
  showSuccess,
  addToCartProductPage,
  loadWhishList,
  addToWhishlist,
  removeFromWhishlist,
};

