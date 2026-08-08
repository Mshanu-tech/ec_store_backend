const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// Extract Cloudinary public_id from URL
const extractCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const pathname = decodeURIComponent(url.pathname);
    const uploadMarker = "/image/upload/";
    const uploadIndex = pathname.indexOf(uploadMarker);

    if (uploadIndex === -1) {
      return null;
    }

    let parts = pathname
      .slice(uploadIndex + uploadMarker.length)
      .split("/")
      .filter(Boolean);

    if (!parts.length) {
      return null;
    }

    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
    if (versionIndex >= 0) {
      parts.splice(versionIndex, 1);
    }

    while (parts.length && (
      /^(f_|q_|w_|h_|c_|g_|ar_|dpr_|fl_|e_|r_|bo_|b_|o_|x_|y_)/.test(parts[0]) ||
      parts[0].includes(",") ||
      parts[0].includes(":") ||
      parts[0].includes("=")
    )) {
      parts.shift();
    }

    if (!parts.length) {
      return null;
    }

    const fileName = parts.pop();
    const lastDot = fileName.lastIndexOf(".");
    const normalizedFileName = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;

    parts.push(normalizedFileName);
    return parts.join("/") || null;
  } catch (error) {
    console.error("Failed to extract Cloudinary public ID:", error.message);
    return null;
  }
};

// Delete local image
const deleteLocalImage = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return;
  }

  const relativePath = imageUrl.replace(/^\/+/, "");
  const localPath = path.join(__dirname, "..", relativePath);

  if (!fs.existsSync(localPath)) {
    return;
  }

  try {
    fs.unlinkSync(localPath);
    console.log("Local image deleted:", localPath);
  } catch (error) {
    console.error("Local image delete failed:", error.message);
  }
};

const deleteCloudinaryImage = async (image) => {
  if (!image) return false;

  const imageUrl = typeof image === "string" ? image : image.url || image.publicId || "";

  if (typeof imageUrl === "string" && !/^https?:\/\//i.test(imageUrl)) {
    deleteLocalImage(imageUrl);
    return false;
  }

  const basePublicIds = [];
  const parsedPublicId = typeof image === "string" ? extractCloudinaryPublicId(imageUrl) : image.publicId;

  if (parsedPublicId) {
    basePublicIds.push(parsedPublicId);
    const parts = parsedPublicId.split("/");
    if (parts.length > 1) {
      basePublicIds.push(parts[parts.length - 1]);
      basePublicIds.push(parts.join(""));
    }
  }

  if (!basePublicIds.length) {
    console.log("No Cloudinary public ID found for:", imageUrl);
    return false;
  }

  const uniquePublicIds = [...new Set(basePublicIds)];

  for (const publicId of uniquePublicIds) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      console.log("Cloudinary delete result for", publicId, result);
      if (result?.result === "ok") {
        return true;
      }
    } catch (error) {
      console.error("Cloudinary deletion error for", publicId, error.message);
    }
  }

  return false;
};
// @desc List products with search/filter/sort/pagination
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword = "",
    category,
    minPrice,
    maxPrice,
    tag,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isActive: true };
  if (keyword) query.name = { $regex: keyword, $options: "i" };
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (minPrice || maxPrice) {
    query["priceOptions.price"] = {};
    if (minPrice) query["priceOptions.price"].$gte = Number(minPrice);
    if (maxPrice) query["priceOptions.price"].$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: "-createdAt",
    priceLowHigh: "priceOptions.0.price",
    priceHighLow: "-priceOptions.0.price",
    rating: "-rating",
    nameAZ: "name",
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .sort(sortMap[sort] || "-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total,
  });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true }).populate("category", "name slug").limit(8);
  res.json({ success: true, products });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug")
    .populate("reviews.user", "name avatar");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, product });
});

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const already = product.reviews.find((r) => r.user.toString() === req.user._id.toString());
  if (already) {
    res.status(400);
    throw new Error("You have already reviewed this product");
  }
  product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
  product.recalculateRating();
  await product.save();
  res.status(201).json({ success: true, message: "Review added" });
});

// ----- Admin -----

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Handle image changes
  if (req.body.images !== undefined) {
    const oldImages = product.images || [];
    const newImages = req.body.images || [];

    const imagesToRemove = oldImages.filter(
      (oldImage) => !newImages.includes(oldImage)
    );

    if (imagesToRemove.length > 0) {
      await Promise.all(
        imagesToRemove.map((image) =>
          deleteCloudinaryImage(image)
        )
      );
    }
  }

  Object.assign(product, req.body);

  const updatedProduct = await product.save();

  res.json({
    success: true,
    product: updatedProduct,
  });
});
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Delete all product images from Cloudinary
  if (product.images && product.images.length > 0) {
    await Promise.all(
      product.images.map((image) =>
        deleteCloudinaryImage(image)
      )
    );
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: "Product and images deleted successfully",
  });
});

const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate("category", "name").sort("-createdAt");
  res.json({ success: true, products });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  createReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};
