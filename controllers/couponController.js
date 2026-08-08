const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort("-createdAt");
  res.json({ success: true, coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  Object.assign(coupon, req.body);
  await coupon.save();
  res.json({ success: true, coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ success: true, message: "Coupon deleted" });
});

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon };
