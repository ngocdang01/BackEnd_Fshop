const cloudinary = require('cloudinary').v2;
const crypto = require("crypto");
const ImageHash = require("../model/model_imageHash");

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// Hàm tạo hash từ file buffer
const getFileHash = (buffer) => {
  return crypto.createHash("md5").update(buffer).digest("hex");
};

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Không có file" });
    }

    // 1️⃣ Tạo hash từ nội dung ảnh
    const hash = getFileHash(file.buffer);

    // 2️⃣ Kiểm tra hash đã tồn tại trong DB chưa (ảnh trùng nội dung)
    const existed = await ImageHash.findOne({ hash });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Ảnh đã tồn tại! Vui lòng chọn ảnh khác.",
        url: existed.url,
      });
    }

    // 3️⃣ Upload ảnh lên Cloudinary bằng stream
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          // { folder: "fshop_products" },
          { folder: "coolmate_products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

    const uploadResult = await uploadToCloudinary();

    // 4️⃣ Lưu hash + URL ảnh vào DB
    await ImageHash.create({ hash, url: uploadResult.secure_url });

    // 5️⃣ Trả về URL ảnh
    return res.json({
      success: true,
      url: uploadResult.secure_url,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Upload thất bại!",
      error: err.message,
    });
  }
};
