const express = require("express");

const postController = require("./posts.controller");
const { auth } = require("firebase-admin");

const router = express.Router();
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limit: { fileSize: 1000000 },
}).single("image");

/**
 * Post routes
 */
router.post("/create", upload, postController.create);
router.post("/comments", postController.addComment);
router.post("/likes", postController.like);

/**
 * Get routes
 */
router.get("/all/:uid", postController.read);
router.get("/followings/:uid", postController.getFollowedPosts);
router.get("/comments/:postId", postController.specificPosts);

module.exports = router;
