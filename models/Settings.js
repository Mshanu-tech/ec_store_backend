const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    storeName: { type: String, default: "FreshCatch Market" },
    storeEmail: { type: String, default: "hello@freshcatchmarket.com" },
    storePhone: { type: String, default: "+91 98765 43210" },
    whatsappNumber: { type: String, default: "+91 98765 43210" },
    address: { type: String, default: "Kozhikode, Kerala" },
    deliveryCharge: { type: Number, default: 40 },
    freeDeliveryThreshold: { type: Number, default: 299 },
    codEnabled: { type: Boolean, default: true },
    onlinePaymentEnabled: { type: Boolean, default: false },
    storeTimings: { type: String, default: "7:00 AM - 9:00 PM, all days" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
