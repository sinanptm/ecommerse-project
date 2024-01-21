const { Cart, User } = require("../models/userModels");
const { Product } = require("../models/productModel");
const { getUserIdFromToken } = require("../util/bcryption")


// * for showing the cart of a user

const loadCart = async (req, res) => {
  try {
    res.render("cart", { valid: req.cookies.token });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message)
  }
};
const addToCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.session.token;
    let { productid, quantity } = req.body;
    quantity = Number(quantity)

    const userId = await getUserIdFromToken(token);

    const userCart = await Cart.findOne({ userId });

    const product = await Product.findById(productid);

    const totalPrice = product.price * quantity;

    if (userCart) {
      const existingProductIndex = userCart.products.findIndex(
        (item) => item.productid.toString() === productid
      );

      if (existingProductIndex !== -1) {
        // If the product is already in the cart, update the quantity
        userCart.products[existingProductIndex].quantity += quantity;

        // Mark the 'products' array as modified to trigger Mongoose to save the changes
        userCart.markModified('products');
      } else {
        userCart.products.push({
          productid: productid,
          quantity: quantity,
          price: product.price,
        });
      }

      userCart.totalPrice += totalPrice;
      userCart.items += quantity;

      const updatedCart = await userCart.save();
    } else {
      // If the user doesn't have a cart, create a new one
      const cart = new Cart({
        products: [{
          productid: productid,
          quantity: quantity,
          price: product.price, // Include the price of the product in the cart item
        }],
        totalPrice: totalPrice,
        items: quantity,
        userId: userId,
        createdate: new Date(),
      });

      // Save the new cart
      const newCart = await cart.save();
    }

    // Redirect to the product page
    res.redirect("/product?id=" + productid);
  } catch (error) {
    // Handle errors gracefully
    console.error(error);
    res.status(400).send(error.message);
  }
};


module.exports = {
  loadCart,
  addToCart
};
