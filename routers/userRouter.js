const express = require("express");
const userRoute = express();
const userController = require("../controllers/userController")
const nocache = require("nocache")
const path = require("path")

userRoute.use(nocache());
// userRoute.use(session({
//     secret:sSecret,
//     resave:true,
//     saveUninitialized:true
// }))
// userRoute.use(cookieParser());

userRoute.set('view engine','ejs')
userRoute.set('views', path.join(__dirname,"../views/user_pages"));
userRoute.use(express.static(path.join(__dirname,'../public')));
userRoute.locals.title = 'TRENDS';


userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}))

userRoute.get('/',(req,res)=>{
    res.render("home")
})
userRoute.get('/home',(req,res)=>{
    res.render("home")
})
userRoute.get('/about',(req,res)=>{
    res.render('about')
})
userRoute.get('/products',(req,res)=>{
    res.render('product')
})
userRoute.get('/product-detials',(req,res)=>{
    res.render('product-detial')
})
userRoute.get('/cart',(req,res)=>{
    res.render('cart')
})
userRoute.get('/blog',(req,res)=>{
    res.render('blog')
})
userRoute.get('/contact',(req,res)=>{
    res.render('contact')
})
userRoute.get('/whishlist',(req,res)=>{
    res.render('cart')
})

module.exports = userRoute;
