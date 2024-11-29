const express = require("express");

const userController = require("./users.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

/**
 * Get routes
 */
router.get("/profile", userController.read);

/**
 * Post routes
 */
router.post("/update", userController.update);

module.exports = router;
