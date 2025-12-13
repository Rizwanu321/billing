// server/index.js - ADD FILE UPLOAD SUPPORT
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads/profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for profile pictures)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const customerRoutes = require("./routes/customers");
const settingsRoutes = require("./routes/settings");
const stockHistoryRoutes = require("./routes/stockHistory");
const categoryRoutes = require("./routes/categories");
const stockRoutes = require("./routes/stock");
const revenueRoutes = require("./routes/revenue");
const aiRoutes = require("./routes/ai");
const translateRoutes = require("./routes/translate");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stock-history", stockHistoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/translate", translateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size is too large. Max 5MB allowed." });
    }
    return res.status(400).json({ message: err.message });
  }

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
    return res.status(400).json({
      message: "Validation Error",
      errors,
    });
  }

  // Handle Cast Errors
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid value for ${err.path}`,
      details: err.message,
    });
  }

  // Generic server error
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
