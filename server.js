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
const { authMiddleware } = require('./middlewares/authMiddleware');
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
const PaymentSettingsRouter = require("./routes/paymentSettingsRoutes");
const MerchantPayoutRouter = require("./routes/merchantPayoutRoutes");

dotenv.config();

const PORT = process.env.PORT || 4000;

// CORS Configuration - allow all origins by default (for local dev).
// In production (Vercel), set CORS_ORIGINS env var to restrict to specific domains.
const allowedOrigins = String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const corsOriginCheck = function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // If no CORS_ORIGINS configured, allow all origins (dev-friendly)
    if (allowedOrigins.length === 0) return callback(null, true);
    // Otherwise check against allow-list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
};

app.use(cors({
    origin: corsOriginCheck,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Disable CDN / browser caching for API responses.
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Vary', 'Origin, Accept-Encoding');
    }
    next();
});

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

// Public Privacy Policy endpoint
app.get(["/privacy", "/privacy-policy", "/api/privacy", "/api/privacy-policy"], (req, res) => {
    res.json({
        success: true,
        title: "KENA E-Commerce Privacy Policy",
        lastUpdated: "2025-04-30",
        compliance: [
            "Electronic Transaction Proclamation No. 1185/2020",
            "Commercial Registration Directive 935/2022",
            "National Bank of Ethiopia (NBE) data rules"
        ],
        contact: {
            email: "support@kenashop.com",
            phones: ["+251 905 042 4520", "+251 905 046 2300"]
        }
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
app.use("/api/payment-settings", PaymentSettingsRouter);
app.use("/api/merchant-payout", MerchantPayoutRouter);
app.use("/api/payout", MerchantPayoutRouter);
app.use("/api/cart", cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/delivery', deliveryRoute);
app.use("/api/size", SizeRoute);

app.use("/api/store", StoreRoute);
app.use("/api/promotion", PromotionRoute);
app.use("/api/report", ReportIssue);
// Mounted at its own path so the admin-only POST /api/register is not
// shadowed by the public POST /api/user/register above.
app.use("/api", RegisterRoutes);
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

// Upload endpoint (authenticated)
app.post("/upload", authMiddleware, upload.single('product'), (req, res) => {
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

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err);
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    const msg = message.toLowerCase();
    if (
      /invalid credentials|email and password are required|verify your email|no refresh token|invalid or expired otp|password reset|wrong password|account has been blocked/.test(msg)
    ) {
      statusCode = 401;
    } else if (/not found|no users found/.test(msg)) {
      statusCode = 404;
    } else if (/missing|required|already|already exists|duplicate/.test(msg)) {
      statusCode = 400;
    }
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
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

    const jwt = require("jsonwebtoken");
    const userRepository = require("./repositories/userRepository");
    const chatRepository = require("./repositories/chatRepository");

    const io = require("socket.io")(server, {
        cors: {
            origin: corsOriginCheck,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true
        }
    });

    app.set("io", io);

    // Socket authentication: a valid JWT is required to connect.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || String(socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
            if (!token) return next(new Error("Authentication required"));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const uid = decoded?.userId ?? decoded?.id;
            if (!uid) return next(new Error("Authentication failed"));
            socket.data.userId = String(uid);
            return next();
        } catch (err) {
            return next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        // Resolve the verified user's role from the DB (client-sent identity is ignored).
        const roleReady = userRepository.findById(socket.data.userId)
            .then((user) => { socket.data.role = user ? user.role : null; })
            .catch(() => { socket.data.role = null; });

        socket.on("setup", async () => {
            await roleReady;
            socket.join(socket.data.userId);
            if (socket.data.role === "admin" || socket.data.role === "superAdmin") {
                socket.join("admins");
            }
            socket.emit("connected");
        });

        socket.on("join chat", async (room) => {
            try {
                if (!room) return;
                const chat = await chatRepository.findChatById(String(room));
                if (!chat) return;
                const members = Array.isArray(chat.users) ? chat.users : [];
                const isMember = members.some((u) => {
                    const uid = typeof u === "object" ? (u._id || u.id) : u;
                    return String(uid) === socket.data.userId;
                });
                if (isMember || socket.data.role === "admin" || socket.data.role === "superAdmin") {
                    socket.join(String(room));
                }
            } catch (err) {
                console.error("Socket join chat error:", err.message);
            }
        });

        socket.on("new message", (newMessageRec) => {
            const chat = newMessageRec?.chat;
            if (!chat) return;
            const chatId = String(chat._id || chat.id || "");
            if (chatId) {
                socket.to(chatId).emit("message received", newMessageRec);
            }
            if (Array.isArray(chat.users)) {
                chat.users.forEach((user) => {
                    const uid = typeof user === "object" ? (user._id || user.id) : user;
                    if (uid && String(uid) !== String(newMessageRec.sender?._id || newMessageRec.sender?.id)) {
                        socket.to(String(uid)).emit("message received", newMessageRec);
                    }
                });
            }
            socket.to("admins").emit("message received", newMessageRec);
        });
    });
}
