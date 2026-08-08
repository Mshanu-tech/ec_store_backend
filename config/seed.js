require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Settings = require("../models/Settings");

const run = async () => {
  await connectDB();
  console.log("Seeding database...");

  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Settings.deleteMany({})]);

  await User.create({
    name: "Admin",
    email: "admin@freshcatch.com",
    password: "admin123",
    role: "admin",
  });

  const [fish, veg, chips] = await Category.create([
    { name: "Cleaned Fish", description: "Fresh, hygienically cleaned fish" },
    { name: "Fresh Cut Vegetables", description: "Cleaned and ready-to-cook vegetables" },
    { name: "Chips & Snacks", description: "Crispy homemade chips and snacks" },
  ]);

  await Product.create([
    {
      name: "Seer Fish (Cleaned)",
      description: "Premium seer fish, cleaned and descaled, sliced and ready to cook.",
      category: fish._id,
      images: [],
      priceOptions: [
        { weight: "250g", price: 159, mrp: 179, stock: 40 },
        { weight: "500g", price: 299, mrp: 349, stock: 40 },
        { weight: "1kg", price: 569, mrp: 649, stock: 20 },
      ],
      tags: ["Fresh"],
      isFeatured: true,
    },
    {
      name: "Rohu Fish (Cleaned)",
      description: "Farm fresh Rohu fish, cleaned and cut into curry pieces.",
      category: fish._id,
      images: [],
      priceOptions: [
        { weight: "500g", price: 199, mrp: 249, stock: 30 },
        { weight: "1kg", price: 379, mrp: 449, stock: 15 },
      ],
      tags: ["Fresh"],
      isFeatured: true,
    },
    {
      name: "Mixed Vegetable Cut",
      description: "A hygienic mix of carrots, peas, cauliflower and more, washed and cut.",
      category: veg._id,
      images: [],
      priceOptions: [
        { weight: "250g", price: 29, mrp: 35, stock: 60 },
        { weight: "500g", price: 49, mrp: 59, stock: 60 },
      ],
      tags: ["Bestseller"],
      isFeatured: true,
    },
    {
      name: "Sliced Onion",
      description: "Freshly peeled and sliced onions, ready to cook.",
      category: veg._id,
      images: [],
      priceOptions: [
        { weight: "250g", price: 25, mrp: 29, stock: 60 },
        { weight: "500g", price: 39, mrp: 49, stock: 60 },
      ],
      tags: ["Fresh"],
    },
    {
      name: "Banana Chips",
      description: "Crispy, homemade Kerala-style banana chips, lightly salted.",
      category: chips._id,
      images: [],
      priceOptions: [
        { weight: "200g", price: 89, mrp: 109, stock: 100 },
        { weight: "500g", price: 199, mrp: 239, stock: 50 },
      ],
      tags: ["Crispy"],
      isFeatured: true,
    },
  ]);

  await Settings.create({ key: "site" });

  console.log("Seed complete. Admin login: admin@freshcatch.com / admin123");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
