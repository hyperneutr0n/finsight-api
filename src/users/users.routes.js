const express = require("express");

const userController = require("./users.controller");
const { auth } = require("firebase-admin");

const router = express.Router();

//ROUTES specific method routes

//name of route, controller to handle PERSIS LARAVEL WOOHOO
//router.post("/google-login", authController.googlelogin);
router.get("/profile", userController.read);
router.post("/update", userController.update);
//router.post("/register", userController.register);

module.exports = router;
