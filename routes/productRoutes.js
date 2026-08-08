const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  createReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/admin/all", protect, admin, getAdminProducts);
router.get("/:slug", getProductBySlug);
router.post("/:id/reviews", protect, createReview);

router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
