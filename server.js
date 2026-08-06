const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const dotenv = require("dotenv");
const connectDB = require('./configure/wubFashionDB');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const morgan = require("morgan"); // Optional: For logging
const UserRouter = require('./routes/userRoutes');
const ProductRouter = require('./routes/productRoutes');
const BrandRouter = require("./routes/brandRoutes");
const BlogRouter = require("./routes/blogRoutes");
const blogcategoryRouter = require("./routes/blogCategoryRoutes");
const ColorRouter = require("./routes/colorRoute");
const ProductCategoryRouter = require("./routes/ProductCategoryRoutes");
const ProductSubcategoryRouter = require("./routes/productSubcategoryRoutes");
const BlogSubcategoryRouter = require("./routes/BlogSubcategoryRoutes");
const tagRouter = require("./routes/tagRoutes");
const couponRouter = require("./routes/CouponRoutes");
const FqaRouter = require("./routes/FqaRoutes");
const UploadRouter = require("./routes/uploadRoute");
const NotificationRouter = require("./routes/notificationRoutes");
const PaymentRouter = require("./routes/paymentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require('./routes/wishlistRoutes');
//const deliveryRoutes = require('./routes/delivery');
const deliveryRoute = require('./api/delivery/route/userRoutes');
const SizeRoute = require("./routes/sizeRoutes")

//new
const PromotionRoute = require("./routes/promotionRoutes");
const ReportIssue = require("./routes/ReportRoute");
const StoreRoute = require("./routes/storeRoute");
const ActivityRoute = require("./routes/ActivityRoutes");
const DocumentRoute = require("./routes/documentRouter")

const RegisterRoutes = require("./routes/registerRoutes");
const MessageRouter = require("./routes/messageRoutes");
const ConversationRoute = require("./routes/conversationRoutes");
const PackageRoute = require("./routes/packageRouter");
const ChatRoutes = require("./routes/chatroutes");

//const http = require("http");
//const { Server } = require("socket.io");


// CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    credentials: true,
}));


dotenv.config();


const PORT = process.env.PORT || 4000;



// Handle preflight requests
app.options('*', cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));

// Connect to PostgreSQL
connectDB();

// Optional: Use morgan for logging HTTP requests
app.use(morgan('combined'));




app.get("/", (req, res) => {
    res.send("Welcome to Merkato Shop API");
});



// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// API Routes
app.use("/api/user", UserRouter);
app.use('/api/product', ProductRouter);
app.use('/api/brand', BrandRouter);
app.use('/api/blog', BlogRouter);
app.use('/api/color', ColorRouter);
app.use('/api/category', ProductCategoryRouter);
app.use('/api/subcategory', ProductSubcategoryRouter);
app.use('/api/tag', tagRouter);
app.use('/api/upload', UploadRouter);
app.use("/api/blogcategory", blogcategoryRouter);
app.use("/api/blogSubcategory", BlogSubcategoryRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/enquiry", FqaRouter);
app.use("/api/notifications", NotificationRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/cart", cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/delivery', deliveryRoute);
app.use("/api/size", SizeRoute);


//new
app.use("/api/store", StoreRoute);
app.use("/api/promotion", PromotionRoute);
app.use("/api/report", ReportIssue);
app.use("/api/user", RegisterRoutes);
app.use("/api/activity", ActivityRoute);
app.use("/api/document", DocumentRoute);

app.use("/api/converstion", ConversationRoute);
app.use("/api/package", PackageRoute);

app.use("/api/chat", ChatRoutes);
app.use("/api/message", MessageRouter);


// Serve Static Files
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'upload/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Serve uploaded images
app.use('/images', express.static(uploadDir));

// Upload endpoint
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${PORT}/images/${req.file.filename}`
    });
});

// 404 Handler (should come after all other routes)
app.use((req, res, next) => {
    res.status(404).send({
        status: 'fail',
        message: `Not Found: ${req.originalUrl}`
    });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Respect a status code set by the route (e.g. res.status(401)); default to 500.
    const statuscode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statuscode).send({ status: 'fail', message: err.message });
});

// Catch-all Route to Serve React's index.html for Client-Side Routing
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the Server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:51650',
            "https://www.stock.kefaycard.com/",
            "https://stock.kefaycard.com/"]
    }
});


io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected")
    })

    socket.on("join chat", (room) => {
        socket.join(room)

    })

    socket.on("new message", (newMessageRec) => {
        var chat = newMessageRec.chat;
        if (!chat.users) return console.log("chat user not defined");

        chat.users.forEach(user => {
            if (user != newMessageRec.sender._id) {
                socket.in(user).emit("message received", newMessageRec);
            }
        });
    });



});
