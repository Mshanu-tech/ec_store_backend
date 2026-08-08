const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  placeOrder,
  validateCoupon,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", protect, placeOrder);
router.post("/validate-coupon", protect, validateCoupon);
router.get("/mine", protect, getMyOrders);
router.get("/admin/all", protect, admin, getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
