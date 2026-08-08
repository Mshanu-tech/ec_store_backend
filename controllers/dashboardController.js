const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, totalProducts, orders] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({}),
    Product.countDocuments({}),
    Order.find({ status: { $ne: "cancelled" } }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  const statusBreakdown = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const topProducts = await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.name", qty: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
    { $sort: { qty: -1 } },
    { $limit: 5 },
  ]);

  const recentOrders = await Order.find({}).populate("user", "name").sort("-createdAt").limit(5);

  res.json({
    success: true,
    stats: { totalUsers, totalOrders, totalProducts, revenue },
    statusBreakdown,
    topProducts,
    recentOrders,
  });
});

module.exports = { getDashboardStats };
