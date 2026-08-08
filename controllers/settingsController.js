const asyncHandler = require("express-async-handler");
const Settings = require("../models/Settings");

const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "site" });
  if (!settings) settings = await Settings.create({ key: "site" });
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "site" });
  if (!settings) settings = new Settings({ key: "site" });
  Object.assign(settings, req.body);
  await settings.save();
  res.json({ success: true, settings });
});

module.exports = { getSettings, updateSettings };
