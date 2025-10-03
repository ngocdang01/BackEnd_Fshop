const express = require("express");
const router = express.Router();

const userController = require("../controller/controller_user");

router.post("/register", userController.register);
router.post("/logout", userController.logout);

module.exports = router;
