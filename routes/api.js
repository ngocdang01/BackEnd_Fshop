const express = require("express");
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const userController = require("../controller/controller_user");
const categoryController = require("../controller/controller_categorie");
const oauthController = require('../controller/controller_oauth');
const addressController = require('../controller/controller_address');
const productController = require('../controller/controller_product');
const saleProductController = require('../controller/controller_sale_product');
const bannerController = require('../controller/controller_banner');
const orderController = require('../controller/controller_order');
const favoriteController = require('../controller/controller_favorite');
const notificationController = require('../controller/controller_notification');
const cartController = require('../controller/controller_cart');
const voucherController = require('../controller/controller_vouchers');
const userVoucherController = require('../controller/controller_user_voucher');
const commentController = require('../controller/controller_comment');
const UserVoucher = require("../model/model_user_voucher");
const chatController = require('../controller/controller_chat');



// link : http://localhost:3002/api/

// Product routes
// link : http://localhost:3002/api/products    // Lấy danh sách sản phẩm
router.get('/products', productController.getAllProducts);   
router.get('/products/active', productController.getActiveProducts);
// link : http://localhost:3002/api/products/search     // Tìm kiếm sản phẩm
router.get('/products/search', productController.searchProducts);
// link : http://localhost:3002/api/products/category/:categoryCode    // Lấy sản phẩm theo category_code
router.get('/products/category/:categoryCode', productController.getProductsByCategory);
// link : http://localhost:3002/api/products/:id     // Lấy chi tiết sản phẩm
router.put('/products/toggle-status/:id', productController.toggleProductStatus);
router.get('/products/:id', productController.getProductById);
// link : http://localhost:3002/api/products/add  // Thêm sản phẩm
router.post('/products/add', productController.createProduct);    
// link : http://localhost:3002/api/products/:id    // Cập nhật lại sản phẩm
router.put('/products/:id', productController.updateProduct);    
// link : http://localhost:3002/api/products/:id  // Xóa sản phẩm
router.delete('/products/:id', productController.deleteProduct);
// linl : http://localhost:3002/api/products/:id/stock
router.put('/products/:id/stock', productController.updateStock);
// linl : http://localhost:3002/api/products/:id/sold
router.put('/products/:id/sold', productController.updateSoldQuantity);
// linl : http://localhost:3002/api/products/:id/detail
router.get('/products/:id/detail', productController.getProductDetailWithComments);

// Sale Product routes
// link : http://localhost:3002/api/sale-products    // Lấy danh sách sản phẩm khuyến mãi
router.get('/sale-products', saleProductController.getAllSaleProducts);  
// link: http://localhost:3002/api/sale-products/search
router.get('/sale-products/search', saleProductController.searchSaleProducts);
// link: http://localhost:3002/api/sale-products/category/:categoryCode       // Lấy sản phẩm khuyến mãi theo category_code
router.get('/sale-products/category/:categoryCode', saleProductController.getSaleProductsByCategory);    
// link: http://localhost:3002/api/sale-products/top-discount
router.get('/sale-products/top-discount', saleProductController.getTopDiscountProducts);
// link: http://localhost:3002/api/sale-products/:id        // Lấy sản phẩm KM theo ID
router.get('/sale-products/:id', saleProductController.getSaleProductById);
// link: http://localhost:3002/api/sale-products/add
router.post('/sale-products/add', saleProductController.createSaleProduct);          // Tạo sản phẩm khuyến mãi mới
// link: http://localhost:3002/api/sale-products/:id       // Cập nhât sản phẩm khuyến mãi
router.put('/sale-products/:id', saleProductController.updateSaleProduct);  
// link : http://localhost:3002/api/sale-products/:id     // Xóa sản phẩm khuyến mãi
router.delete('/sale-products/:id', saleProductController.deleteSaleProduct);
// link: http://localhost:3002/api/sale-products/:id/discount-status
router.put('/sale-products/:id/discount-status', saleProductController.updateDiscountStatus);
// link: http://localhost:3002/api/sale-products/:id/sold
router.put('/sale-products/:id/sold', saleProductController.updateSoldCount);
// link: http://localhost:3002/api/sale-products/best-selling
router.get('/sale-products/best-selling', saleProductController.getBestSellingProducts);
// link: http://localhost:3002/api/sale-products/:id/detail
router.get('/sale-products/:id/detail', saleProductController.getSaleProductDetailWithComments);

// User routes
// link : http://localhost:3002/api/register
router.post("/register", userController.register);
// link : http://localhost:3002/api/login
router.post("/login", userController.login);
// link : http://localhost:3002/api/profile
router.get('/profile', auth, userController.getProfile);
// link : http://localhost:3002/api/profile
router.put('/profile', auth, userController.updateProfile);
// link : http://localhost:3002/api/profile/field
router.put('/profile/field', auth, userController.updateField);
// link : http://localhost:3002/api/change-password
router.put('/change-password', auth, userController.changePassword);
// link : http://localhost:3002/api/users
router.get('/users', userController.getAllUsers);
// link : http://localhost:3002/api/users/:id
router.get('/users/:id', userController.getUserById);
// link : http://localhost:3002/api/users/:id
router.put('/users/:id', userController.updateUserById);
// link : http://localhost:3002/api/users/:id/toggle-active
router.patch("/users/:id/toggle-active", userController.toggleActive);
// link : http://localhost:3002/api/users/:id
router.delete('/users/:id', userController.deleteUser);
// link : http://localhost:3002/api/reset-password
router.post('/reset-password', userController.resetPassword);
// link : http://localhost:3002/api/logout
router.post("/logout", userController.logout);


// OAuth routes
// link: http://localhost:3002/api/auth/google
router.post('/auth/google', oauthController.googleAuth);
// link: http://localhost:3002/api/auth/facebook
router.post('/auth/facebook', oauthController.facebookFirebaseLogin);
// link: http://localhost:3002/api/auth/link/google
router.post('/auth/link/google', auth, oauthController.linkGoogleAccount);
// link: http://localhost:3002/api/auth/link/facebook
router.post('/auth/link/facebook', auth, oauthController.linkFacebookAccount);

// Address routes
// link: http://localhost:3001/api/addresses/user/:id_user
router.get('/addresses/user/:id_user', addressController.getAddressesByUser);
// link: http://localhost:3001/api/addresses/:id
router.get('/addresses/:id', addressController.getAddressById);
// link: http://localhost:3001/api/addresses
router.post('/addresses', addressController.createAddress);
// link: http://localhost:3001/api/addresses/:id
router.put('/addresses/:id', addressController.updateAddress);
// link: http://localhost:3001/api/addresses/:id
router.delete('/addresses/:id', addressController.deleteAddress);
// link: http://localhost:3001/api/addresses/:id/default
router.put('/addresses/:id/default', addressController.setDefaultAddress);
// link: http://localhost:3001/api/addresses/default/:id_user
router.get('/addresses/default/:id_user', addressController.getDefaultAddress);

// Order routes
// link : http://localhost:3002/api/orders
router.post('/orders', orderController.createOrder);
// link: http://localhost:3002/api/orders
router.get('/orders', orderController.getAllOrders);
// link: http://localhost:3002/api/orders/:id
router.get('/orders/:id', orderController.getOrderById);
// link: http://localhost:3002/api/orders/user/:userId
router.get('/orders/user/:userId', orderController.getOrdersByUserId);
// link : http://localhost:3002/api/orders/:id/status
router.put('/orders/:id/status', orderController.updateStatus);


// thông báo
// link: http://localhost:3001/api/notifications/add
router.post('/notifications/add', notificationController.add);
// link: http://localhost:3001/api/notifications/user/:userId
router.get('/notifications/user/:userId', notificationController.getByUserId);
// link: http://localhost:3001/api/notifications/read/:id
router.put('/notifications/read/:id', notificationController.markAsRead);
// link: http://localhost:3001/api/notifications/unread-count/:userId
router.get('/notifications/unread-count/:userId', notificationController.getUnreadCount);


// Category router
// link : http://localhost:3002/api/categories/active
router.get('/categories/active', categoryController.getActiveCategories);
// link : http://localhost:3002/api/categories
router.get('/categories', categoryController.getAllCategories);
// link : http://localhost:3002/api/categories/code/:code
router.get('/categories/code/:code', categoryController.getCategoryByCode);
// link : http://localhost:3002/api/categories/add
router.post('/categories/add', categoryController.createCategory);
// link : http://localhost:3002/api/categories/toggle/:id
router.put('/categories/toggle/:id', categoryController.toggleCategoryStatus);
// link : http://localhost:3002/api/categories/:id
router.get('/categories/:id', categoryController.getCategoryById);
// link : http://localhost:3002/api/categories/:id
router.put('/categories/:id', categoryController.updateCategory);
// link : http://localhost:3002/api/categories/:id
router.delete('/categories/:id', categoryController.deleteCategory);

// Voucher routes
// link: http://localhost:3002/api/vouchers
router.get('/vouchers', voucherController.getAllVouchers);
// link: http://localhost:3002/api/vouchers/active
router.get('/vouchers/active', voucherController.getActiveVouchers);
// link: http://localhost:3002/api/vouchers/global
router.get('/vouchers/global', voucherController.getGlobalVouchers);
// link: http://localhost:3002/api/vouchers/:code
router.get('/vouchers/:code', voucherController.getVoucherByCode);
// link: http://localhost:3002/api/vouchers/add
router.post('/vouchers/add', voucherController.createVoucher);
// link: http://localhost:3002/api/vouchers/:code
router.put('/vouchers/:code', voucherController.updateVoucher);
// link: http://localhost:3002/api/vouchers/:code
router.delete('/vouchers/:code', voucherController.deleteVoucher);
// link: http://localhost:3002/api/vouchers/validate
router.post('/vouchers/validate', voucherController.validateVoucher);

// User-Voucher routes
// link: http://localhost:3002/api/user-vouchers/assign
router.post('/user-vouchers/assign', userVoucherController.assignVoucherToUser);
// link: http://localhost:3002/api/user-vouchers/user/:userId
router.get('/user-vouchers/user/:userId', userVoucherController.getUserVouchers);
// link: http://localhost:3001/api/user-vouchers/:userVoucherId/use
router.put('/user-vouchers/:userVoucherId/use', userVoucherController.markVoucherAsUsed);
// link: http://localhost:3001/api/user-vouchers/validate
router.post('/user-vouchers/validate', userVoucherController.validateUserVoucher);
// link: http://localhost:3001/api/user-vouchers/available/:userId
router.get('/user-vouchers/available/:userId', userVoucherController.getAvailableVouchersForUser);
// link: http://localhost:3001/api/user-vouchers/:userVoucherId
router.delete('/user-vouchers/:userVoucherId', userVoucherController.removeUserVoucher);

// Admin tặng voucher cho user khi đăng nhập
// link: http://localhost:3001/api/users/gift-voucher
router.post('/users/gift-voucher', userController.giftVoucherToUser);
// link: http://localhost:3001/api/users/gift-voucher-multiple
router.post('/users/gift-voucher-multiple', userController.giftVoucherToMultipleUsers);

// CART ROUTES
// link: http://localhost:3002/api/carts/add
router.post('/carts/add', cartController.addToCart);
// link: http://localhost:3002/api/carts/:user_id
router.get('/carts/:user_id', cartController.getCartByUserId);
// link: http://localhost:3002/api/carts/upsert
router.put('/carts/upsert', cartController.upsertCart);
// link: http://localhost:3002/api/carts/:user_id/item
router.put('/carts/:user_id/item', cartController.updateItemQuantity);
// link: http://localhost:3002/api/carts/:user_id/item
router.delete('/carts/:user_id/item', cartController.deleteItemFromCart);
// link: http://localhost:3002/api/carts/:user_id
router.delete('/carts/:user_id', cartController.deleteCartByUserId);

// Favorite routes
// link: http://localhost:3002/api/favorites
router.get('/favorites', favoriteController.getAllFavorites);
// link: http://localhost:3002/api/favorites/:userId
router.get('/favorites/:userId', favoriteController.getUserFavorites);
// link: http://localhost:3002/api/favorites/add
router.post('/favorites/add', favoriteController.addToFavorites);
// link: http://localhost:3002/api/favorites/:userId/:productId
router.delete('/favorites/:userId/:productId', favoriteController.removeFromFavorites);
// link: http://localhost:3002/api/favorites/check/:userId/:productId
router.get('/favorites/check/:userId/:productId', favoriteController.checkFavorite);
// link: http://localhost:3002/api/products/:productId/detail/:userId
router.get('/products/:productId/detail/:userId', favoriteController.getProductDetailWithFavoriteAndComments);

// Comment routes
// link: http://localhost:3002/api/comments/:productId (lấy tất cả comment của sản phẩm)
router.get('/comments/:productId', commentController.getProductDetailWithComments);
// link: http://localhost:3002/api/comments/add (thêm comment mới)
router.post('/comments/add', commentController.createComment);
//(thêm nhiều comment mới)
router.post('/comments/add-multi', commentController.createMultipleComments);

// Banner routes
// link: http://localhost:3002/api/banners
router.get('/banners', bannerController.getAllBanners);
// link: http://localhost:3002/api/banners/active
router.get('/banners/active', bannerController.getActiveBanners);
// link: http://localhost:3002/api/banners/:id
router.get('/banners/:id', bannerController.getBannerById);
// link: http://localhost:3002/api/banners
router.post('/banners', bannerController.createBanner);
// link: http://localhost:3002/api/banners/:id
router.put('/banners/:id', bannerController.updateBanner);
// link: http://localhost:3002/api/banners/:id
router.delete('/banners/:id', bannerController.deleteBanner);
// link: http://localhost:3002/api/banners/:id/toggle
router.put('/banners/:id/toggle', bannerController.toggleBannerStatus);

// Chat routes
// link: http://localhost:3002/api/chats/create
router.post('/chats/create', chatController.createChat);
// link: http://localhost:3002/api/chats/message
router.post('/chats/message', chatController.sendMessage);
// link: http://localhost:3002/api/chats/:chatId
router.get('/chats/:chatId', chatController.getMessages);
// link: http://localhost:3002/api/chats/user/:userId
router.get('/chats/user/:userId', chatController.getUserChats);
// link: http://localhost:3002/api/chats/read
router.post('/chats/read', chatController.markAsRead);
// link: http://localhost:3002/api/chats
router.get('/chats', chatController.getAllChats);

// POST  link: http://localhost:3002/api/chats/message/reaction
router.post('/message/reaction', chatController.reactionToMessage);
// DELETE  link: http://localhost:3002/api/chats/message/:chatId/:messageId
router.delete('/message/:chatId/:messageId', chatController.deleteMessage);
// DELETE  link: http://localhost:3002/api/chats/message/:chatId/:messageId
router.delete('/chats/:chatId', chatController.deleteChat);


module.exports = router;
