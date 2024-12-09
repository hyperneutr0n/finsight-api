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
//router.get("/profile/followings/:uid", userController.getFollowings);
router.get("/followers/:uid", userController.getFollowers);
router.get("/followings/:uid", userController.getFollowings);
router.get("/chat/:uidSender/:uidReceiver", userController.getChat);

/**
 * Post routes
 */
router.put("/update", userController.update);
router.post("/follow", userController.following);
router.post("/chat", userController.chat);
router.put("/addphoto", upload, userController.addPhoto);

module.exports = router;
