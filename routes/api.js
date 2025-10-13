const express = require("express");
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const userController = require("../controller/controller_user");
const categoryController = require("../controller/controller_categorie");
const oauthController = require('../controller/controller_oauth');
const productController = require('../controller/controller_product');

// User router
// link : http://localhost:3002/api/

// Product routes
// link : http://localhost:3002/api/products    // Lấy danh sách sản phẩm
router.get('/products', productController.getAllProducts);  
// link : http://localhost:3002/api/products/:id     // Lấy chi tiết sản phẩm
router.get('/products/:id', productController.getProductById);
// link : http://localhost:3002/api/products/add  // Thêm sản phẩm
router.post('/products/add', productController.createProduct);    
// link : http://localhost:3002/api/products/:id  // Xóa sản phẩm
router.delete('/products/:id', productController.deleteProduct);

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

module.exports = router;
