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
const deliveryRoute = require('./api/delivery/route/userRoutes');
const SizeRoute = require("./routes/sizeRoutes");

// New routes
const PromotionRoute = require("./routes/promotionRoutes");
const ReportIssue = require("./routes/ReportRoute");
const StoreRoute = require("./routes/storeRoute");
const ActivityRoute = require("./routes/ActivityRoutes");
const DocumentRoute = require("./routes/documentRouter");
const RegisterRoutes = require("./routes/registerRoutes");
const MessageRouter = require("./routes/messageRoutes");
const ConversationRoute = require("./routes/conversationRoutes");
const PackageRoute = require("./routes/packageRouter");
const ChatRoutes = require("./routes/chatroutes");

dotenv.config();

const PORT = process.env.PORT || 4000;

// CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    credentials: true,
}));

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
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Root welcome route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to kena Shop API",
        version: "1.0.0"
    });
});

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

// Serve Static Files safely (handles Vercel read-only filesystem)
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
}

const uploadDir = path.join(__dirname, 'upload/images');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (e) {
    console.warn('Upload directory creation skipped (read-only filesystem):', e.message);
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
    if (!req.file) {
        return res.status(400).json({ success: 0, message: "No file uploaded" });
    }
    res.json({
        success: 1,
        image_url: `/images/${req.file.filename}`
    });
});

// 404 Handler for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({
        success: false,
        status: 'fail',
        message: `API Route Not Found: ${req.originalUrl}`
    });
});

// Generic 404 Handler
app.use((req, res, next) => {
    if (fs.existsSync(path.join(buildPath, 'index.html'))) {
        return res.sendFile(path.join(buildPath, 'index.html'));
    }
    res.status(404).json({
        success: false,
        status: 'fail',
        message: `Not Found: ${req.originalUrl}`
    });
});

// Global Error Handler Middleware (500)
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack || err);
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Export app for Vercel Serverless deployment
module.exports = app;

// Start server locally if not running on Vercel
if (!process.env.VERCEL) {
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
                "https://stock.kefaycard.com/"
            ]
        }
    });

    io.on("connection", (socket) => {
        socket.on("setup", (userData) => {
            socket.join(userData._id);
            socket.emit("connected");
        });

        socket.on("join chat", (room) => {
            socket.join(room);
        });

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
}
