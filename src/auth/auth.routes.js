const express = require("express");

const authController = require("./auth.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

/**
 * Post routes
 */
router.post("/login", authController.login);
router.post("/register", authController.register);

module.exports = router;
