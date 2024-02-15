const { express, nocache, session, cookieParser } = require('./util/modules')
const app = express();
require("dotenv").config();
const connectMongoDB = require('./config/mongodb')
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
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);




// Admin routes
app.use("/admin", adminRouter);

// User routes
app.use("/", userRoute);

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`App is running on http://127.0.0.1:${port}`);
});
