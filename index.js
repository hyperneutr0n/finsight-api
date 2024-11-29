/**
 * Imports
 */
require("dotenv").config();
const express = require("express");
const defaultRoutes = require("./src/default/default.routes");
const authRoutes = require("./src/auth/auth.routes");
const userRoutes = require("./src/users/users.routes");
const app = express();
app.use(express.json());

/**
 * Load secrets from mounted file if available
 */
const secretFilePath = "/secrets/finsight-env-secret";
if (fs.existsSync(secretFilePath)) {
  console.log("Loading secrets from mounted file...");
  const secretContent = fs.readFileSync(secretFilePath, "utf-8");
  const envVars = Object.fromEntries(
    secretContent
      .split("\n")
      .map((line) => line.split("="))
      .filter((pair) => pair.length === 2)
  );

  // Merge the loaded secrets into process.env
  process.env = { ...process.env, ...envVars };
} else {
  console.log("No secrets file found. Using existing environment variables.");
}

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
 * Routing to ML methods
 */


/**
 * Server initialization
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
