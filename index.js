const express = require("express");
const app = express();
const mongoose = require("mongoose");

const userRoute = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");


// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Trends_ecommerce_store")
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });


// User routes
app.use("/", userRoute);

// Admin routes
app.use("/admin", adminRouter);


// 404 Not Found middleware
app.use((req, res, next) => {
  res.status(404).send(`
  <style>body{text-align:center;color:blue;padding:100px;background:url('https://ssl.gstatic.com/accounts/embedded/signin_tapyes.gif') center/contain no-repeat;}h1{font-size:50px;margin-bottom:20px;}p{font-size:18px;}</style></head>
  <body><a style="color:red;" href="/home">home</a><h1>404 Not Found</h1><p>Sorry, the page you are looking for might be in another castle.</p>
  `);
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`App is running on http://127.0.0.1:${port}`);
});
