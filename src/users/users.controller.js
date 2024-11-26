const { auth, db } = require("../firebase");
const admin = require("../firebase.admin");
const {
  updateDoc,
  doc,
  collection,
  addDoc,
  getDoc,
} = require("firebase/firestore");

exports.read = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        message: "User not found!",
      });
    }

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return res.status(400).json({
        message: "User not found!",
      });
    }
    return res.status(200).json({
      message: "User found!",
      user: snapshot.data(),
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(500).json({
      message: "Error retrieving user!",
      error: errorMessage,
    });
  }
};

exports.update = async (req, res) => {
  const { uid, profileRisk } = req.body;

  const userRef = doc(db, "users", uid);

  if (!uid || !profileRisk) {
    return res.status(400).json({
      message: "UID and profile risk are required!",
    });
  }

  try {
    await updateDoc(userRef, {
      profileRisk: profileRisk,
    });

    return res.status(200).json({
      message: "Profile risk updated successfully!",
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(500).json({
      message: "Failed to update profile risk!",
      error: errorMessage,
    });
  }
};
