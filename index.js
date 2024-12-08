/**
 * Imports
 */
require("dotenv").config();
const express = require("express");
const defaultRoutes = require("./src/default/default.routes");
const authRoutes = require("./src/auth/auth.routes");
const userRoutes = require("./src/users/users.routes");
const postRoutes = require("./src/posts/posts.routes");
const newsRoutes = require("./src/news/news.routes");
const app = express();
app.use(express.json());

/**
 * Default routing
 */
app.use("/", defaultRoutes);

/**
 * Routing to authentication methods
 */
app.use("/auth", authRoutes);

/**
 * Routing to users methods
 */
app.use("/users", userRoutes);

/**
 * Routing to posts methods
 */
app.use("/posts", postRoutes);

/**
 * Routing to News methods
 */
app.use("/news", newsRoutes);

/**
 * Server initialization
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
