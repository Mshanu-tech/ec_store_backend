const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { getCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/couponController");

router.get("/", protect, admin, getCoupons);
router.post("/", protect, admin, createCoupon);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

module.exports = router;
