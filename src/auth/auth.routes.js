const express = require("express");

const authController = require("./auth.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

//ROUTES specific method routes

//name of route, controller to handle PERSIS LARAVEL WOOHOO
//router.post("/google-login", authController.googlelogin);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/test", authController.test);

module.exports = router;
