const { Cart, User } = require("../models/userModels");
const { Product } = require("../models/productModel");
const { getUserIdFromToken } = require("../util/bcryption");




// * for adding new items to the cart

const addToCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { productid, quantity } = req.body;
    quantity = Number(quantity)
    const userId = await getUserIdFromToken(token);
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
          price: product.price,
        });
      }

      userCart.totalPrice += totalPrice;
      userCart.items = userCart.products.length; // Set the total items based on the unique products

      const updatedCart = await userCart.save();
    } else {
      // Create a new cart if the user doesn't have one
      const cart = new Cart({
        products: [{
          productid: productid,
          quantity: quantity,
          price: product.price,
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

// * for showing the cart of a user

const loadCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    if (!token) {

      const cart = {
        items: 0,
      }
      return res.render("cart", { valid: req.cookies.token, products: [], cart, discountPrice: 0 });
    }
    const userId = await getUserIdFromToken(token);

    let cart = await Cart.findOne({ userId }).populate({
      path: 'products.productid',
      model: 'Product',
      select: 'name description price img _id discount quantity'
    });
    if (!cart) {
      cart = {
        items: 0,
      }
      return res.render("cart", { valid: req.cookies.token, products: [], cart, discountPrice: 0 });
    }

    const products = cart.products;
    let discountPrice = 0;

    let totalPrice 
    for (const cartProduct of products) {
      const product = cartProduct.productid;
      if (product.quantity >= 0) {
        const discountedPrice = product.price * (1 - product.discount / 100);
        discountPrice += discountedPrice * cartProduct.quantity;
        totalPrice = cart.totalPrice 
      }else{
        totalPrice = cart.totalPrice - product.price
      }
    }

    return res.render("cart", { valid: req.cookies.token, products, cart, discountPrice,totalPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};




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



module.exports = {
  loadCart,
  addToCart,
  addQuantity,
  removeProduct
};
