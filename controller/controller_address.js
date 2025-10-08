const Address = require('../model/model_address');

const getAddresses = async (req, res) => {
    try {
        const { id_user } = req.params;
        console.log("id_user param:", id_user);
        const id_user_trim = id_user.trim();
        const addresses = await Address.find({ id_user: id_user_trim });
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