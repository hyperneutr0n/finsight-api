//IMPORTS and INITIALIZATION
require("dotenv").config();
const express = require("express");
const authRoutes = require("./src/auth/auth.routes");
const app = express();
app.use(express.json());

//ROUTES

//Auth routes
app.use("/auth", authRoutes); //base route /auth, additional methods will be handled in auth.routes.js

//ML routes

//PORT and LISTEN
const PORT = process.env.port || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
