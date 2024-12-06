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
  getDocs,
  query,
  where,
  writeBatch,
  increment,
} = require("firebase/firestore");

const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limit: { fileSize: 1000000 },
}).single("image");

const { Storage } = require("@google-cloud/storage");

const { MulterGoogleCloudStorage } = require("multer-google-storage");

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.PROFILE_BUCKET_KEY,
});

const bucket = storage.bucket("finsight-profile");

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
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        status: "failed",
        message: "User not found!",
      });
    }

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    const postRef = query(
      collection(db, "posts"),
      where("authorUid", "==", uid)
    );

    const postSnapshot = await getDocs(postRef);

    const posts = postSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
      posts: posts,
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

exports.addPhoto = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, function (err) {
        if (err) {
          if (
            err instanceof multer.MulterError &&
            err.code === "LIMIT_FILE_SIZE"
          ) {
            return reject({
              status: 413,
              message:
                "Payload content length greater than maximum allowed: 1000000",
            });
          }
          return reject({
            status: 400,
            message: "An error occurred during file upload. Please try again.",
          });
        }
        resolve();
      });
    });

    const { uid } = req.body;
    const { image } = req.file;

    if (!uid || !image) {
      return res.status(400).json({
        status: "failed",
        message: "Image or UID is unavailable",
      });
    }

    const tempPath = file.path;

    const newFileName = `${uid}${path.extname(file.originalname)}`;

    const targetPath = path.join("uploads", newFileName);
  } catch (error) {}
};

exports.following = async (req, res) => {
  const { uid, followingUid } = req.body;

  try {
    const batch = writeBatch(db);
    const userRef = doc(db, "users", uid);
    const followingRef = doc(db, "users", followingUid);

    const userFollowingRef = doc(
      collection(userRef, "followings"),
      followingUid
    );

    const followedUserRef = doc(collection(followingRef, "followers"), uid);

    batch.set(userFollowingRef, {
      followedAt: new Date(),
    });
    batch.set(followedUserRef, {
      followedAt: new Date(),
    });

    batch.update(userRef, {
      numFollowings: increment(1),
    });

    batch.update(followingRef, {
      numFollowers: increment(1),
    });

    await batch.commit();

    res.status(200).json({
      status: "success",
      message: "User followed!",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "Failed to follow user!",
    });
  }
};
