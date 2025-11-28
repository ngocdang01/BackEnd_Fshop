var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var http = require("http");
require("./model/db"); 

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiRouter = require("./routes/api");
const vnpayRoutes = require('./routes/vnPay');

var app = express();

// ✔ Tạo server TRƯỚC
const server = http.createServer(app);

// ✔ Khởi tạo socket.io
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['*'],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});
app.set('io', io);

// ✔ Nạp socket handlers
const initializeNotificationSocket = require('./socketHandlers/notificationHandlers');
const initializeOrderSocket = require('./socketHandlers/orderStatus');
initializeOrderSocket(io);
initializeNotificationSocket(io);

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// No-cache API
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routers
app.use("/", indexRouter);
app.use("/users", usersRouter);
// upload file ảnh
var uploadRouter = require("./routes/upload");
app.use("/api", uploadRouter);
app.use("/api", apiRouter);
app.use('/vnpay', vnpayRoutes);

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// ✔ Export đúng
module.exports =  { app, server };
