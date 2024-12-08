const express = require("express");

const newsController = require("./news.controller");

const router = express.Router();

router.get("/:date", newsController.fetch);

module.exports = router;
