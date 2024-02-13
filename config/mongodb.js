 
const mongoose = require("mongoose");

module.exports = () => {
mongoose.connect(process.env.MONGODB_LINK)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });
}