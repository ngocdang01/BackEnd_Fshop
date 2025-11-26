const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { uploadImage } = require("../controller/controller_upload");

// /api/upload-image
router.post("/upload-image", upload.single("image"), uploadImage);

module.exports = router;
