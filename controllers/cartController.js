const { Cart, User } = require("../models/userModels");
const { Product, Order } = require("../models/productModel");
const { getUserIdFromToken } = require("../util/bcryption");




// * for adding new items to the cart

const addToCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { productid, quantity } = req.body;
    quantity = Number(quantity)
    const userId = await getUserIdFromToken(token);
    const user = await User.findById(userId)
    if (!user) {
      return res.status(304).redirect('/login?toast=to add a product to cart you should register first')
    }
    const userCart = await Cart.findOne({ userId });
    const product = await Product.findById(productid);


    if (product.quantity <= 0) {
      // Handle the case where the product quantity is zero or less
      // You may want to display an error or redirect the user
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

    res.redirect("/product?id=" + productid);

  } catch (error) {
    console.error(error);
    res.status(500).redirect("/products"); // Handle other errors with a 500 status and redirect
  }
};



const addToCartProductPage = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { id, } = req.query;
    const productid = id;
    let quantity = 1;
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
      return res.render("cart", { products: [], cart: { items: 0 }, productsToCheckout: { productid: 0, quantity: 0 }, totalPrice: 0, });
    }

    const userId = await getUserIdFromToken(token);

    let cart = await Cart.findOne({ userId }).populate({
      path: 'products.productid',
      model: 'Product',
    });

    if (!cart) {
      return res.render("cart", { products: [], cart: { items: 0 }, productsToCheckout: { productid: 0, quantity: 0 }, totalPrice: 0 });
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

    return res.render("cart", { products, cart, totalPrice, productsToCheckout, toast: req.query.toast });
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
    const productId = req.params.id
    const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
    const cart = await Cart.findOne({ userId })

    const productIndex = cart.products.findIndex(product => product.productid.equals(productId))
    if (productIndex === -1) {
      console.error('Product not found in the cart:', productId);
      res.status(404).redirect('/cart');
      return;
    }

    const removedProduct = cart.products.splice(productIndex, 1)[0];

    const q = cart.items -= 1
    const price = cart.totalPrice -= removedProduct.price
    await cart.save()
    res.redirect('/cart')

  } catch (error) {
    console.log(error.message);
  }
}


// * for sending datas to checkout page 

const addToCheckout = async (req, res) => {
  try {
    let { totalprice, products } = req.body;
    const parsedProducts = Array.isArray(products) ? products : [products];
    req.session.parsedProducts = parsedProducts
    req.session.totalAmount = totalprice
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
    const parsedProducts = req.session.parsedProducts
    const total = req.session.totalAmount
    const token = req.cookies.token || req.session.token;
    if (!token) {
      
    }
    const userId = await getUserIdFromToken(token);

    if (total !== req.query.t) {
      return res.status(304).redirect('/cart')
    }
   
    if (!total || !token) {
      return res.status(302).redirect('/cart');
    }

    let products = parsedProducts
    try {
      products = JSON.parse(products);
    } catch (error) {
      console.error('Error parsing products:', error.message);
      return res.status(500).redirect('/cart');
    }

    const user = await User.findById(userId).populate('address');

    if (!user) {
      console.log('no userid');
      return res.status(302).redirect('/cart');
    }

    if (!Array.isArray(products) || products.length === 0) {
      console.log('nop product')
      return res.status(302).redirect('/cart');
    }

    const productIds = products.map(product => product.productid);
    const populatedProducts = await Product.find({ _id: { $in: productIds } });

    let totalDiscount = 0;
    let subtotal = 0
    const totalPrices = populatedProducts.map((product, i) => {
      subtotal = product.price * products[i].quantity
      const discount = product.discount || 0;
      const discountedPrice = (product.price - (product.price * discount / 100)) * products[i].quantity;
      totalDiscount += (product.price * products[i].quantity) - discountedPrice;
      return discountedPrice;
    });

    const totalPrice = totalPrices.reduce((acc, curr) => acc + curr, 0);

    // Render the checkout page
    res.render("checkout", {
      user, subtotal, products, totalPrice, totalDiscount, parsedProducts
    });

  } catch (error) {
    console.error('Error in loadCheckout:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

// * for placing new order 
const placeOrder = async (req, res) => {
  try {
    const userId = await getUserIdFromToken(req.cookies.token || req.session.token);
    let { totalprice, products, payment_method, address } = req.body;
    const orderDate = Date.now();
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    products = JSON.parse(products);
    const productIds = products.map(product => product.productid);
    const populatedProducts = await Product.find({ _id: { $in: productIds } });

    const outOfStockProducts = populatedProducts.filter(product => product.quantity <= 0);
    if (outOfStockProducts.length > 0) {
      return res.redirect(`/checkout?t=${req.session.totalAmount}&&msg=some products where out of stock plese chect you cart again`);
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

    const details = populatedProducts.map((product, i) => ({
      productid: product._id,
      price: product.price,
      quantity: products[i].quantity,
      name: product.name
    }));

    for (const product of populatedProducts) {
      product.quantity -= 1;
      await product.save();
    }


    const newOrder = new Order({
      userid: userId,
      orderAmount: totalprice,
      payment: payment_method,
      deliveryAddress: address,
      orderDate,
      orderStatus: "1",
      deliveryDate,
      OrderedItems: details
    });
    const order = await newOrder.save();
    res.redirect("/order-success?id=" + order._id);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Failed to place order: " + error.message);
  }
};




const showSuccess = async (req, res) => {
  try {
    const id = req.query.id
    const order = await Order.findById(id)
      .populate('userid')
      .populate('OrderedItems.productid');


    if (!order) {
      res.redirect("/cart")
    }
    res.render('order-success', { order })

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
  showSuccess,
  addToCartProductPage
};

