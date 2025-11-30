const User = require("../model/model_user");
const UserVoucher = require('../model/model_user_voucher');
const Voucher = require('../model/model_voucher');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Đăng ký tài khoản mới
exports.register = async (req, res) => {
  try {
    const { name, email, password, avatar, phone, address, sex } = req.body;
    console.log('Register attempt for email:', email);
    console.log('Register attempt for name:', name);
    console.log('Register attempt for password:', password);

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        // Nếu user bị khóa → không cho đăng ký lại
        if (existingUser.isActive === false) {
            return res.status(403).json({
                message: "Tài khoản với email này đã bị khóa. Không thể đăng ký lại."
            });
        }

        // Nếu user đang hoạt động → email đã tồn tại
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
      avatar: avatar || "https://i.pinimg.com/736x/bc/43/98/bc439871417621836a0eeea768d60944.jpg",
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
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("No user found with email:", email);
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }
    // Kiểm tra user bị khóa
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ Admin!"
      });
    }

    // Kiểm tra mật khẩu
    console.log('Comparing password...');
    console.log('Stored password hash:', user.password);
    console.log('Attempting to compare with:', password);

    try {
      // Xac thuc auth(Mật khẩu)
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        console.log('Password does not match for user:', email);
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      }
      // Tạo JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      console.log("Login successful for user:", email);

      // Tự động tặng voucher cho user mới đăng nhập
            try {
                await assignWelcomeVoucher(user._id);
            } catch (voucherError) {
                console.log('Error assigning welcome voucher:', voucherError.message);
            }

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
          sex: user.sex
        }
      });
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      res.status(500).json({ message: "Lỗi xác thực mật khẩu", error: compareError.message });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// Lấy thông tin user
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
// Cập nhật thông tin user 
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar, phone, address, sex } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    // Kiểm tra email có bị trùng khôngkhông
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if(existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
    }
    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Validate phone number
    if (phone && !/^[0-9]{10, 11}$/.test(phone)) {
      return res .status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    // Câp nhât thông tin
    const updateData = {};
    if(name) updateData.name = name;
    if(email) updateData.email = email;
    if(avatar) updateData.avatar = avatar;
    if(phone !== undefined) updateData.phone = phone;
    if(address !== undefined) updateData.address = address;
    if(sex !== undefined) updateData.sex = sex;

    // Cập nhật user với dữ liệu mới
    Object.assign(user, updateData);
    await user.save();

    // Trả vè thông tin user đã cập nhập(không bao gồm password)
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({
      message: 'Cập nhật thông tin thành công',
      user: updatedUser,
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
// Cập nhật thông tin từng trường riêng lẻ
exports.updateField = async (req, res) => {
 try{
    const { field, value } = req.body;
    const user = await User.findById(req.user.userId);

    if ( !user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    
    //Danh sách các trường được phép cập nhật
    const allowedFields = [ 'name', 'email', 'avatar', 'phone', 'address', 'sex'];
    
    if (! allowedFields.includes(field)) {
      return res.status(400).json({ 
        message: 'Trường không hợp lệ', 
        allowedFields });
    }

    // Validation cho từng trường
    if ( field === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return res.status(400).json({ message: 'Email không hợp lệ' });
    }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({email: value});
      if( existingUser && existingUser._id.toString() !== user._id.toString()){
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
    }
    if (field === 'phone' && value && !/^[0-9]{10,11}$/.test(value)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }

  if (field === 'sex' && !['Nam', 'Nữ', 'Khác'].includes(value)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
  }
  // Cập nhật trường
  user[field] = value;
  await user.save();

// trả về thông tin user đã cập nhật
  const updatedUser = await User.findById(user._id).select('-password');
  res.json({
    message: `Cập nhât ${field} thành công`,
    user: updatedUser,
    updateField: field,
    newValue: value
  });
 } catch (error){
  res.status(500).json({ message: 'Lỗi server', error: error.message});
 }
  };

  // Lấy thông tin user theo ID (cho admin)
  exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
// Cập nhật thông tin user theo ID (cho admin)
exports.updateUserById = async (req, res) => {
  try {
      const userId = req.params.id;
      const { name, email, avatar, phone, address, sex, role } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'Không tìm thấy user' });
      }
      // Kiểm tra email mới có bị trùng không
      if (email && email !== user.email) {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
              return res.status(400).json({ message: 'Email đã tồn tại' });
          }
      }
      // Validate email format
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ message: 'Email không hợp lệ' });
      }
      // Validate phone format
      if (phone && !/^[0-9]{10,11}$/.test(phone)) {
          return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }

      // Validate role
      if (role && !['user', 'admin'].includes(role)) {
          return res.status(400).json({ message: 'Role không hợp lệ' });
      }
      // Cập nhật thông tin
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (avatar) updateData.avatar = avatar;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (sex) updateData.sex = sex;
      if (role) updateData.role = role;

      Object.assign(user, updateData);
      await user.save();

      const updatedUser = await User.findById(userId).select('-password');
    
      res.json({ 
          message: 'Cập nhật thông tin user thành công', 
          user: updatedUser,
          updatedFields: Object.keys(updateData)
      });
  } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
          return res.status(404).json({ message: 'Không tìm thấy user' });
      }

      // Kiểm tra mật khẩu hiện tại
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
      }

      // Mã hóa và cập nhật mật khẩu mới
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách user
exports.getAllUsers = async (req, res) => {
  try {
      const users = await User.find().select('-password');
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Reset password (for development only)
exports.resetPassword = async (req, res) => {
  try {
      const { email, newPassword } = req.body;
      console.log('Reset password attempt for:', email);
      
      if (!email || !newPassword) {
          console.log('Missing email or password');
          return res.status(400).json({ message: 'Email và mật khẩu mới là bắt buộc' });
      }

      const user = await User.findOne({ email });
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
          console.log('No user found with email:', email);
          return res.status(404).json({ message: 'Không tìm thấy user' });
      }

      try {
          // Hash new password
          console.log('Hashing new password...');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          console.log('Password hashed successfully');
          
          user.password = hashedPassword;
          await user.save();
          console.log('Password updated successfully for user:', email);
          
          res.json({ 
              message: 'Đặt lại mật khẩu thành công',
              hashedPassword: hashedPassword // For debugging only
          });
      } catch (hashError) {
          console.error('Error hashing password:', hashError);
          res.status(500).json({ message: 'Lỗi khi mã hóa mật khẩu', error: hashError.message });
      }
  } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
// Khóa mở User
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }
    user.isActive = user.isActive === true ? false : true;
    await user.save();

    res.json({
      success: true,
      isActive: user.isActive,
      message: user.isActive ? "Đã mở khóa người dùng" : "Đã khóa người dùng",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
      const userId = req.params.id;
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'Không tìm thấy user' });
      }

      // Xóa user
      await User.findByIdAndDelete(userId);
      res.json({ message: 'Xóa user thành công' });
  } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
// Logout(Đăng xuất)
exports.logout = (req, res) => {
  // Chỉ trả về thông báo, clinet sẽ tự xóa token
  res.json({ message: "Đăng xuất thành công" });
};

// Tặng voucher khi đăng nhập
const assignWelcomeVoucher = async (userId) => {
    try {
        // Tìm voucher FREESHIP
        const voucher = await Voucher.findOne({ code: 'FREESHIP', type: "shipping" });
        
        if (!voucher) {
            console.log('Không tìm thấy voucher FREESHIP');
            return;
        }

        // Kiểm tra voucher có active và còn hiệu lực không
        const currentDate = new Date();
        if (voucher.status !== 'active' || 
            currentDate < voucher.startDate || 
            currentDate > voucher.expireDate) {
            console.log('Voucher FREESHIP không hợp lệ');
            return;
        }

        // Kiểm tra user đã có voucher này chưa
        const existingUserVoucher = await UserVoucher.findOne({
            userId,
            voucherId: voucher._id,
            used: false
        });

        if (existingUserVoucher) {
            console.log('Người dùng đã sở hữu voucher FREESHIP rồi');
            return;
        }

        
        // Kiểm tra user có đạt giới hạn sử dụng chưa
        const userVoucherCount = await UserVoucher.countDocuments({
            userId,
            voucherId: voucher._id,
            used: true
        });

        if (userVoucherCount >= voucher.usageLimitPerUser) {
            console.log('Người dùng đã sử dụng hết số lần cho phép đối với voucher FREESHIP');
            return;
        }

        // Tạo user voucher mới
        const userVoucher = new UserVoucher({
            userId,
            voucherId: voucher._id,
            source: 'system',
            note: 'Tặng khi đăng nhập lần đầu'
        });

        await userVoucher.save();
        console.log('Tặng (gán) voucher Welcome cho người dùng thành công:', userId);
        
    } catch (err) {
        console.error('Lỗi khi gán (tặng) voucher Welcome cho người dùng:', err.message);
    }
};
// Admin tặng voucher cho user
exports.giftVoucherToUser = async (req, res) => {
    try {
        const { userId, voucherCode, source, note } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
        if (!voucher) return res.status(404).json({ success: false, message: "Không tìm thấy Voucher" });
        
        const currentDate = new Date();
        if (
            voucher.status !== "active" ||
            currentDate < voucher.startDate ||
            currentDate > voucher.expireDate
        ) return res.status(400).json({ success: false, message: "Voucher hợp lệ" });

        // Check if user already has this voucher
        const existingUserVoucher = await UserVoucher.findOne({
            userId,
            voucherId: voucher._id,
            used: false
        });

        if (existingUserVoucher) {
            return res.status(400).json({
                success: false,
                message: 'Người dùng đã sở hữu voucher này rồi'
            });
        }

        // Check if user has reached the usage limit
        const userVoucherCount = await UserVoucher.countDocuments({
            userId,
            voucherId: voucher._id,
            used: true
        });

        if (userVoucherCount >= voucher.usageLimitPerUser) {
            return res.status(400).json({
                success: false,
                message: 'Người dùng đã sử dụng hết số lần cho phép đối với voucher này'
            });
        }

        // Create user voucher
        const userVoucher = new UserVoucher({
            userId,
            voucherId: voucher._id,
            source,
            note: note || ""
        });

        await userVoucher.save();
        await userVoucher.populate('voucherId');

        res.json({
            success: true,
            message: 'Tặng (gửi) voucher thành công',
            data: userVoucher
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Admin tặng voucher cho nhiều user
exports.giftVoucherToMultipleUsers = async (req, res) => {
    try {
        const { userIds, voucherCode, source, note } = req.body;

        const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher'
            });
        }

        const currentDate = new Date();
        if (
            voucher.status !== "active" ||
            currentDate < voucher.startDate ||
            currentDate > voucher.expireDate
        ) return res.status(400).json({ success: false, message: "Voucher không hợp lệ" });

        let success = [];
        let failed = [];

        // Process each user
        for (const userId of userIds) {
            try {
                // Check if user exists
                const user = await User.findById(userId);
                if (!user) {
                    failed.push({
                        userId,
                        reason: 'Không tìm thấy người dùng'
                    });
                    continue;
                }

                // Check if user has reached the usage limit
                const userVoucherCount = await UserVoucher.countDocuments({
                    userId,
                    voucherId: voucher._id
                });

                if (userVoucherCount >= voucher.usageLimitPerUser) {
                    failed.push({
                        userId,
                        reason: 'Người dùng đã sử dụng hết số lần cho phép'
                    });
                    continue;
                }

                // Create user voucher
                const userVoucher = new UserVoucher({
                    userId,
                    voucherId: voucher._id,
                    source: source,
                    note: note || ""
                });

                await userVoucher.save();
                success.push({ userId });

            } catch (err) {
                failed.push({
                    userId,
                    reason: err.message
                });
            }
        }

        res.json({
            success: true,
            data: { success, failed }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};