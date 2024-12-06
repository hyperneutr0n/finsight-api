const express = require("express");

const newsController = require("./news.controller");

const router = express.Router();

router.get("/", newsController.news);

module.exports = router;
