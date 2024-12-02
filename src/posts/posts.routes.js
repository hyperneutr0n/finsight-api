const express = require("express");

const postController = require("./posts.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

/**
 * Post routes
 */
router.post("/create", postController.create);
router.post("/comments", postController.addComment);
router.post("/likes", postController.like);

/**
 * Get routes
 */
router.post("/all", postController.read);
router.post("/followings", postController.getFollowedPosts);
router.post("/comments", postController.specificPosts);

module.exports = router;
