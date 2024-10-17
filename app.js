const { express, nocache, session, cookieParser } = require('./util/modules');
const app = express();
require("dotenv").config();
const { PORT, SECRET } = process.env
const connectMongoDB = require('./config/mongodb');
const userRoute = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");

connectMongoDB()

app.use(nocache());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
  })
);


app.use("/admin", adminRouter);

app.use("/", userRoute);

app.use((error,req,res,next)=>{
  console.error(error);
})

app.listen(PORT, () => {
  console.log(`App is running on http://127.0.0.1:${PORT}`);
});
