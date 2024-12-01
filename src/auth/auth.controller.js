/**
 * Imports
 */
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} = require("firebase/auth");

const { auth, db } = require("../firebase");

const admin = require("../firebase.admin");

const {
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
} = require("firebase/firestore");

/**
 * @method login
 *
 * @description
 * Login with finsight credentials
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      username,
      password
    );
    const user = userCredential.user;
    if (user.emailVerified === true) {
      const token = await user.getIdToken();
      return res.status(200).json({
        status: "success",
        message: "Login successful!",
        user: user.uid,
        token,
      });
    } else if (user.emailVerified === false) {
      await sendEmailVerification(user);
      return res.status(400).json({
        status: "failed",
        message: "Verify your email first, please check your email!",
      });
    }
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      status: "failed",
      message: "Invalid credentials!",
      error: errorMessage,
    });
  }
};

/**
 * @method register
 *
 * @description
 * Register a new user to finsight
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      username,
      password
    );
    const user = userCredential.user;

    try {
      // Add user to database
      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, {
        username: user.email,
        createdAt: new Date(),
        profileRisk: "",
      });

      try {
        // Send email verification
        await sendEmailVerification(user);
        return res.status(201).json({
          status: "success",
          message: "Registration successful! Verification email sent.",
          user: user.uid,
        });
      } catch (error) {
        const errorMessage = error.message;
        return res.status(500).json({
          status: "failed",
          message:
            "Registration successful, but failed to send email verification!",
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error.message;
      return res.status(500).json({
        status: "failed",
        message: "Failed to add user data to Firestore!",
        error: errorMessage,
      });
    }
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      status: "failed",
      message: "Registration failed!",
      errorMessage,
    });
  }
};

/**
 * @method test
 *
 * @description
 * Token verification method
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.test = (req, res) => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Authorization token missing or invalid",
    });
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      return res.status(200).json({
        status: "success",
        message: "Authenticated successfully",
        uid: uid,
      });
    })
    .catch((error) => {
      return res.status(401).json({
        status: "failed",
        message: "Invalid token",
        error: error.message,
      });
    });
};
