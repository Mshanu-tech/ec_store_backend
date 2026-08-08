const mongoose = require("mongoose");
const slugify = require("slugify");

const priceOptionSchema = new mongoose.Schema(
  {
    weight: { type: String, required: true }, // e.g. "250g", "500g", "1kg"
    price: { type: Number, required: true },
    mrp: { type: Number },
    stock: { type: Number, default: 50 },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    priceOptions: { type: [priceOptionSchema], required: true },
    tags: [{ type: String }], // e.g. "Fresh", "Bestseller", "Crispy"
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre("validate", function (next) {
  if (this.name) this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Math.random().toString(36).slice(2, 7);
  next();
});

productSchema.methods.recalculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
  this.numReviews = this.reviews.length;
};

module.exports = mongoose.model("Product", productSchema);
