const User = require("../model/model_user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { use } = require("react");

// Đăng ký tài khoản mới
exports.register = async (req, res) => {
  try {
    const { name, email, password, avatar, phone, address, sex } = req.body;

    // Kiểm tra email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Bảo mật mật khẩu cao
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
      avatar:
        avatar ||
        "https://cdn.britannica.com/35/238335-050-2CB2EB8A/Lionel-Messi-Argentina-Netherlands-World-Cup-Qatar-2022.jpg",
      phone: phone || "",
      address: address || "Chưa cập nhật",
      sex: sex || "Nam",
    });

    await user.save();
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi đăng ký", error: error.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("No user found with email:", email);
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    try {
      // Tạo JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );
      console.log("Login successful for user:", email);
      res.json({
        message: "Đăng nhập thành công",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
          address: user.address,
          sex: user.sex,
        },
      });
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      res.status(500).json({
        message: "Lỗi xác thực mật khẩu",
        error: compareError.message,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// Logout(Đăng xuất)
exports.logout = async (req, res) => {
  res.json({ message: "Đăng xuất thành công" });
};
