 
const mongoose = require("mongoose");

module.exports = () => {
// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Trends_ecommerce_store")
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {

    console.error('Error connecting to MongoDB:', error.message);
  });
}