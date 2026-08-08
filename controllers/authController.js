const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  addresses: user.addresses,
});

// @desc Register a new customer
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ success: true, token: genToken(user._id), user: sanitize(user) });
});

// @desc Login (customer or admin)
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (user.isBlocked) {
    res.status(403);
    throw new Error("Your account has been blocked. Contact support.");
  }
  res.json({ success: true, token: genToken(user._id), user: sanitize(user) });
});

// @desc Admin login (must have role admin)
// @route POST /api/auth/admin-login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  
  const user = await User.findOne({ email, role: "admin" }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid admin credentials");
  }
  res.json({ success: true, token: genToken(user._id), user: sanitize(user) });
});

// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitize(req.user) });
});

module.exports = { register, login, adminLogin, getMe };
