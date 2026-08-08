const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");

// @desc Upload one or more images, returns public URLs
// @route POST /api/upload
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }

  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  const urls = [];

  for (const file of req.files) {
    try {
      if (!hasCloudinaryConfig) {
        urls.push(`/uploads/${file.filename}`);
        continue;
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "freshmarket",
        resource_type: "image",
      });

      urls.push(result.secure_url);
    } catch (error) {
      urls.push(`/uploads/${file.filename}`);
    } finally {
      const tempFilePath = file.path;
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  res.json({ success: true, urls });
});

module.exports = { uploadImages };
