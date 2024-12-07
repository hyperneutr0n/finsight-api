const express = require("express");

const userController = require("./users.controller");
const { auth } = require("firebase-admin");

const router = express.Router();
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limit: { fileSize: 1000000 },
}).single("image");

/**
 * Get routes
 */
router.get("/profile/:uid", userController.read);
router.get("/profile/:uid/:followingUid", userController.readProfile);

/**
 * Post routes
 */
router.put("/update", userController.update);
router.post("/follow", userController.following);
router.put("/addphoto", upload, userController.addPhoto);

module.exports = router;
