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


module.exports = userRoute;
