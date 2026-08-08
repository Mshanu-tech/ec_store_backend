const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getUsers,
  getUserById,
  updateUserByAdmin,
  toggleBlockUser,
} = require("../controllers/userController");

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:productId", protect, toggleWishlist);

// Admin
router.get("/", protect, admin, getUsers);
router.get("/:id", protect, admin, getUserById);
router.put("/:id", protect, admin, updateUserByAdmin);
router.put("/:id/toggle-block", protect, admin, toggleBlockUser);

module.exports = router;
