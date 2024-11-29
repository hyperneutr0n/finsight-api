/**
 * Imports
 */
const { auth, db } = require("../firebase");
const admin = require("../firebase.admin");
const {
  updateDoc,
  doc,
  collection,
  addDoc,
  getDoc,
} = require("firebase/firestore");

/**
 * @method read
 * 
 * @description
 * Find user from uid
 * 
 * @return {JSON}
 * JSON Formatted responses
 * 
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.read = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        status: "failed",
        message: "User not found!",
      });
    }

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return res.status(400).json({
        status: "failed",
        message: "User not found!",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "User found!",
      user: snapshot.data(),
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(500).json({
      status: "failed",
      message: "Error retrieving user!",
      error: errorMessage,
    });
  }
};

/**
 * @method update
 * 
 * @description
 * Update user data from uid
 * 
 * @return {JSON}
 * JSON Formatted responses
 * 
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.update = async (req, res) => {
  const { uid, profileRisk } = req.body;

  const userRef = doc(db, "users", uid);

  if (!uid || !profileRisk) {
    return res.status(400).json({
      status: "failed",
      message: "UID and profile risk are required!",
    });
  }

  try {
    await updateDoc(userRef, {
      profileRisk: profileRisk,
    });

    return res.status(200).json({
      status: "success",
      message: "Profile risk updated successfully!",
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(500).json({
      status: "failed",
      message: "Failed to update profile risk!",
      error: errorMessage,
    });
  }
};
