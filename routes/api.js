const express = require("express");
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const userController = require("../controller/controller_user");
const categoryController = require("../controller/controller_categorie");
const oauthController = require('../controller/controller_oauth');
const productController = require('../controller/controller_product');
const saleProductController = require('../controller/controller_sale_product');
const bannerController = require('../controller/controller_banner');

const favoriteController = require('../controller/controller_favorite');
const cartController = require('../controller/controller_cart');


// User router
// link : http://localhost:3002/api/

// Product routes
// link : http://localhost:3002/api/products    // Lấy danh sách sản phẩm
router.get('/products', productController.getAllProducts);   
// link : http://localhost:3002/api/products/search     // Tìm kiếm sản phẩm
router.get('/products/search', productController.searchProducts);
// link : http://localhost:3002/api/products/category/:categoryCode    // Lấy sản phẩm theo category_code
router.get('/products/category/:categoryCode', productController.getProductsByCategory);
// link : http://localhost:3002/api/products/:id     // Lấy chi tiết sản phẩm
router.get('/products/:id', productController.getProductById);
// link : http://localhost:3002/api/products/add  // Thêm sản phẩm
router.post('/products/add', productController.createProduct);    
// link : http://localhost:3002/api/products/:id    // Cập nhật lại sản phẩm
router.put('/products/:id', productController.updateProduct);    
// link : http://localhost:3002/api/products/:id  // Xóa sản phẩm
router.delete('/products/:id', productController.deleteProduct);

// Sale Product routes
// link : http://localhost:3002/api/sale-products    // Lấy danh sách sản phẩm khuyến mãi
router.get('/sale-products', saleProductController.getAllSaleProducts);  
// link: http://localhost:3002/api/sale-products/category/:categoryCode       // Lấy sản phẩm khuyến mãi theo category_code
router.get('/sale-products/category/:categoryCode', saleProductController.getSaleProductsByCategory);    
// link: http://localhost:3002/api/sale-products/:id        // Lấy sản phẩm KM theo ID
router.get('/sale-products/:id', saleProductController.getSaleProductById);
// link: http://localhost:3002/api/sale-products/add
router.post('/sale-products/add', saleProductController.createSaleProduct);          // Tạo sản phẩm khuyến mãi mới
// link: http://localhost:3002/api/sale-products/:id       // Cập nhât sản phẩm khuyến mãi
router.put('/sale-products/:id', saleProductController.updateSaleProduct);  
// link : http://localhost:3002/api/sale-products/:id     // Xóa sản phẩm khuyến mãi
router.delete('/sale-products/:id', saleProductController.deleteSaleProduct);


// Product user
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
// link : http://localhost:3002/api/users/:id
router.delete('/users/:id', userController.deleteUser);
// link : http://localhost:3002/api/reset-password
router.post('/reset-password', userController.resetPassword);
// link : http://localhost:3002/api/logout
router.post("/logout", userController.logout);


// Category router
// link : http://localhost:3002/api/categories
router.get('/categories', categoryController.getAllCategories);
// link : http://localhost:3002/api/categories/code/:code
router.get('/categories/code/:code', categoryController.getCategoryByCode);
// link : http://localhost:3002/api/categories/:id
router.get('/categories/:id', categoryController.getCategoryById);
// link : http://localhost:3002/api/categories/add
router.post('/categories/add', categoryController.createCategory);
// link : http://localhost:3002/api/categories/:id
router.put('/categories/:id', categoryController.updateCategory);
// link : http://localhost:3002/api/categories/:id
router.delete('/categories/:id', categoryController.deleteCategory);

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

// Favorite routes

// link: http://localhost:3002/api/favorites
router.get('/favorites', favoriteController.getAllFavorites);
// link: http://localhost:3002/api/favorites/:userId
router.get('/favorites/:userId', favoriteController.getUserFavorites);
// link: http://localhost:3002/api/favorites/add
router.post('/favorites/add', favoriteController.addToFavorites);
// link: http://localhost:3001/api/favorites/:userId/:productId
router.delete('/favorites/:userId/:productId', favoriteController.removeFromFavorites);
// link: http://localhost:3001/api/favorites/check/:userId/:productId
router.get('/favorites/check/:userId/:productId', favoriteController.checkFavorite);

// Cart routes
// link: http://localhost:3002/api/carts
router.post('/carts/add', cartController.addToCart);
router.get('/carts/:user_id', cartController.getCartByUserId);
router.put('/carts/:user_id/item', cartController.updateItemQuantity);
router.delete('/carts/:user_id/item', cartController.deleteItemFromCart);
router.delete('/carts/:user_id', cartController.deleteCartByUserId);
router.put('/carts/upsert', cartController.upsertCart);
module.exports = router;
