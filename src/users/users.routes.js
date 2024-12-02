const express = require("express");

const userController = require("./users.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

/**
 * Get routes
 */
router.get("/profile/:uid", userController.read);

/**
 * Post routes
 */
router.put("/update", userController.update);
router.post("/follow", userController.following);

module.exports = router;
