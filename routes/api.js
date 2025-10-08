const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require("../controller/controller_user");
const oauthController = require('../controller/controller_oauth');

// User router

// link : http://localhost:3002/api/register
router.post("/register", userController.register);
// link :  
router.post("/login", userController.login);
// link : http://localhost:3002/api/profile
router.get('/profile', auth, userController.getProfile);
// link : http://localhost:3002/api/profile
router.put('/profile', auth, userController.updateProfile);
// linl : http://localhost:3002/api/profile/field
router.put('/profile/field', auth, userController.updateField);
// linl : http://localhost:3002/api/change-password
router.put('/change-password', auth, userController.changePassword);
// linl : http://localhost:3002/api/users
router.get('/users', userController.getAllUsers);
// linl : http://localhost:3002/api/users/:id
router.get('/users/:id', userController.getUserById);
// linl : http://localhost:3002/api/users/:id
router.put('/users/:id', userController.updateUserById);
// linl : http://localhost:3002/api/users/:id
router.delete('/users/:id', userController.deleteUser);
// linl : http://localhost:3002/api/reset-password
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

module.exports = router;
