require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

connectDB();

const app = express();

app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173", process.env.ADMIN_URL || "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, message: "FreshCatch API is running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use(notFound);
app.use(errorHandler);

const DEFAULT_PORT = process.env.PORT || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => console.log(`FreshCatch API running on port ${port}`));

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && !process.env.PORT) {
      console.warn(`Port ${port} is already in use. Trying 5001...`);
      startServer(5001);
      return;
    }

    console.error(`Server error: ${err.message}`);
    process.exit(1);
  });
};

startServer(DEFAULT_PORT);
