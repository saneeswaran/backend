const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const notificationRoutes = require("./routes/notification");

const app = express();
const PORT = process.env.PORT || 3000; // Default port if not defined in .env

// Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Ensure static file paths are correctly referenced
const staticPaths = {
  products: path.join(__dirname, "public", "image", "products"),
  category: path.join(__dirname, "public", "image", "category"),
  poster: path.join(__dirname, "public", "image", "posters"),
};
app.use(
  "/image/poster",
  express.static(path.join(__dirname, "public/posters"))
);
const categoryImageDir = path.join(__dirname, "../public/images/category");

// Serve static images
app.use("/image/products", express.static(staticPaths.products));
app.use("/image/category", express.static(staticPaths.category));
app.use("/image/poster", express.static(staticPaths.poster));

console.log("Static file paths configured:");
console.log(staticPaths);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const db = mongoose.connection;
db.on("error", (error) => console.error("❌ Database error:", error));
db.once("open", () => console.log("✅ Connected to Database"));

// Routes
app.use("/categories", require("./routes/category"));
app.use("/subCategories", require("./routes/subCategory"));
app.use("/brands", require("./routes/brand"));
app.use("/variantTypes", require("./routes/variantType"));
app.use("/variants", require("./routes/variant"));
app.use("/products", require("./routes/product"));
app.use("/couponCodes", require("./routes/couponCode"));
app.use("/posters", require("./routes/poster"));
app.use("/users", require("./routes/user"));
app.use("/orders", require("./routes/order"));
app.use("/payment", require("./routes/payment"));
app.use("/image", express.static("public/image"));
app.use("/image", express.static("public"));
app.use(
  "/image/category",
  express.static(path.join(__dirname, "public/images/category"))
);
app.use("/notification", notificationRoutes);

// Test API route
app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "API working successfully",
      data: null,
    });
  })
);

// Global error handler
app.use((error, req, res, next) => {
  console.error("⚠️ Global Error:", error.message);
  res.status(500).json({ success: false, message: error.message, data: null });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://192.168.1.2:${PORT}`);
});
