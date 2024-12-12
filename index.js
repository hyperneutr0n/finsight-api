/**
 * Import dependencies
 */
require("dotenv").config();
const fs = require('fs');
const express = require("express");

/**
 * Setup profile-bucket-key
 */
if (process.env.NODE_ENV === 'production') {
  const PROFILE_BUCKET_KEY_SECRET = process.env.PROFILE_BUCKET_KEY_VAL;
  if (!PROFILE_BUCKET_KEY_SECRET) {
    console.error('PROFILE_BUCKET_KEY is undefined');
    process.exit(1);
  }

  fs.fileWrite('./profile-bucket-key.json', PROFILE_BUCKET_KEY_SECRET, (err) => {
    if (err) {
      console.error('Error writing profile-bucket-key.json');
      process.exit(1);
    }
    console.log();
  });
}
/**
 * Import routing
 */
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
