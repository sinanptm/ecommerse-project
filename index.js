const express = require("express");
const app = express();
const mongoose = require("mongoose")

const userRoute = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");

mongoose.connect("mongodb://127.0.0.1:27017/Trends_ecommerce_store");

// for user routes
app.use("/", userRoute);
// app.use("/admin", adminRouter);
app.use((req, res, next) => {
  res.status(404);
  res.send(
    `<style>body{text-align:center;color:blue;padding:100px;background:url('https://ssl.gstatic.com/accounts/embedded/signin_tapyes.gif') center/contain no-repeat;}h1{font-size:50px;margin-bottom:20px;}p{font-size:18px;}</style></head><body><a style="color:red;" href="http://127.0.0.1:${p}">home</a><h1>404 Not Found</h1><p>Sorry, the page you are looking for might be in another castle.</p>`
  );
});

var p = process.env.PORT || 3786;
app.listen(p, () => {
  console.log(`app is running on http://127.0.0.1:${p}`);
});
