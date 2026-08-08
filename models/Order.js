const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    image: String,
    weight: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    itemsPrice: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "processing", "out_for_delivery", "delivered", "cancelled", "rejected"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    invoiceNumber: { type: String },
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.invoiceNumber = "FC-" + Date.now().toString().slice(-8);
    this.statusHistory.push({ status: this.status, note: "Order placed" });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
