const express = require("express");

const router = express.Router();

/**
 * Get routes
 */
router.get("/", async (req, res) => {
  return res.status(200).json( {
    status: "success",
    message: "Request with GET method received."
  });
});

/**
 * Post routes
 */
router.post("/", async (req, res) => {
  return res.status(200).json( {
    status: "success",
    message: "Request with POST method received."
  });
});

module.exports = router;
