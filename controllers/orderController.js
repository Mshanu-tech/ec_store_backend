const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");

const findPrice = (product, weight) => {
  const opt = product.priceOptions.find((p) => p.weight === weight);
  return opt ? opt.price : product.priceOptions[0].price;
};

// @desc Place a new order
// @route POST /api/orders
const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No order items provided");
  }

  let itemsPrice = 0;
  const orderItems = [];
  for (const it of items) {
    const product = await Product.findById(it.product);
    if (!product) continue;
    const price = findPrice(product, it.weight);
    itemsPrice += price * it.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || "",
      weight: it.weight,
      price,
      quantity: it.quantity,
    });
  }

  const settings = (await Settings.findOne({ key: "site" })) || {};
  let deliveryCharge = itemsPrice >= (settings.freeDeliveryThreshold || 299) ? 0 : settings.deliveryCharge || 40;

  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && itemsPrice >= coupon.minOrderAmount) {
      discount = coupon.type === "percentage" ? (itemsPrice * coupon.value) / 100 : coupon.value;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const totalPrice = Math.max(0, itemsPrice + deliveryCharge - discount);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    deliveryCharge,
    discount,
    couponCode: couponCode || undefined,
    totalPrice,
  });

  res.status(201).json({ success: true, order });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error("Invalid or expired coupon");
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error("This coupon has expired");
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("This coupon has reached its usage limit");
  }
  if (cartTotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
  }
  let discount = coupon.type === "percentage" ? (cartTotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  res.json({ success: true, discount, coupon });
});

// @desc Get logged-in user orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json({ success: true, orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }
  res.json({ success: true, order });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }
  if (["delivered", "cancelled", "out_for_delivery"].includes(order.status)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled once ${order.status.replace("_", " ")}`);
  }
  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", note: "Cancelled by customer" });
  await order.save();
  res.json({ success: true, order });
});

// ----- Admin -----

const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const orders = await Order.find(query).populate("user", "name email phone").sort("-createdAt");
  res.json({ success: true, orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === "delivered") order.paymentStatus = "paid";
  await order.save();
  res.json({ success: true, order });
});

module.exports = {
  placeOrder,
  validateCoupon,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
