const Address = require('../model/model_address');

// Lấy danh sách địa chỉ của user
const getAddressesByUser = async (req, res) => {
    try {
        const { id_user } = req.params;
        console.log("id_user param:", id_user);
        const id_user_trim = id_user.trim();
        const addresses = await Address.find({ userId: id_user_trim });
        console.log("addresses found:", addresses);

        res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error){
        res.status(500).json({
            success: false,
            message: 'Loi khi lay danh sach dia chi',
            error: error.message
        });
    }
};

// Lấy địa chỉ của user
const getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);
        
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }
        
        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin địa chỉ',
            error: error.message
        });
    }
};
// Thêm mới địa chỉ
const createAddress = async (req, res) => {
    try {
        const {
            fullName,
            province,
            district,
            commune,
            receivingAddress,
            phone,
            id_user,
            gps
        } = req.body;
        // KIểm tra bắt buộc
        if (!fullName || !province || !district || !commune || !receivingAddress || !phone || !id_user) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }
        // Kiểm tra GPS hợp lệ khôngkhông
        if (!gps || typeof gps.lat !== 'number' || typeof gps.lng !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Tọa độ GPS không hợp lệ'
            });
        }

        const newAddress = new Address({
            fullName,
            province,
            district,
            commune,
            receivingAddress,
            phone,
            userId: id_user, 
            gps
        });

        const savedAddress = await newAddress.save();
        res.status(201).json({
            success: true,
            message: 'Tạo địa chỉ thành công',
            data: savedAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo địa chỉ',
            error: error.message
        });
    }
};
// Cập nhật địa chỉ
const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const address = await Address.findById(id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }
        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            message: 'Cập nhật địa chỉ thành công',
            data: updatedAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật địa chỉ',
            error: error.message
        });
    }
};
// Xóa địa chỉ
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }
        await Address.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Xóa địa chỉ thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa địa chỉ',
            error: error.message
        });
    }
};
// Gán 1 địa chỉ làm mặc định
const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_user } = req.body;

        // First, remove default status from all addresses of this user
        await Address.updateMany(
            {  userId: id_user  },
            { $unset: { isDefault: 1 } }
        );

        // Set the selected address as default
        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            { isDefault: true },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đặt địa chỉ mặc định thành công',
            data: updatedAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt địa chỉ mặc định',
            error: error.message
        });
    }
};
// Lấy địa chỉ là mặc định
const getDefaultAddress = async (req, res) => {
    try {
        const { id_user } = req.params;
        const defaultAddress = await Address.findOne({ 
            userId: id_user , 
            isDefault: true 
        });
        if (!defaultAddress) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ mặc định'
            });
        }
        res.status(200).json({
            success: true,
            data: defaultAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy địa chỉ mặc định',
            error: error.message
        });
    }
};
module.exports = {
    getAddressesByUser,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress
}
