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
  documentId,
} = require("firebase/firestore");

const fs = require("fs");

const { Storage } = require("@google-cloud/storage");

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

exports.readProfile = async (req, res) => {
  try {
    const { uid, followingUid } = req.params;

    if (!uid || !followingUid) {
      return res.status(400).json({
        status: "failed",
        message: "User not found!",
      });
    }

    const userRef = doc(db, "users", followingUid);
    const snapshot = await getDoc(userRef);

    const postRef = query(
      collection(db, "posts"),
      where("authorUid", "==", followingUid)
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

    const followingRef = collection(doc(db, "users", uid), "followings");

    const followingSnapshot = await getDocs(followingRef);

    const followingUidSet = new Set(
      followingSnapshot.docs.map((doc) => doc.id)
    );

    const likeQuerySnapshot = await getDocs(
      query(collection(db, "likes"), where("authorUid", "==", uid))
    );

    const likePostIds = new Set(
      likeQuerySnapshot.docs.map((doc) => doc.data().postId)
    );

    const postWithLikes = posts.map((doc) => ({
      ...doc,
      liked: likePostIds.has(doc.id),
    }));

    return res.status(200).json({
      status: "success",
      message: "User found!",
      user: snapshot.data(),
      posts: postWithLikes,
      isFollowed: followingUidSet.has(followingUid),
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

// await new Promise((resolve, reject) => {
//   upload(req, res, function (err) {
//     if (err) {
//       if (
//         err instanceof multer.MulterError &&
//         err.code === "LIMIT_FILE_SIZE"
//       ) {
//         return reject({
//           status: 413,
//           message:
//             "Payload content length greater than maximum allowed: 1000000",
//         });
//       }
//       return reject({
//         status: 400,
//         message: "An error occurred during file upload. Please try again.",
//       });
//     }
//     resolve();
//   });
// });
exports.addPhoto = async (req, res) => {
  try {
    const { uid } = req.body;
    const file = req.file;

    if (!uid || !file) {
      return res.status(400).json({
        status: "failed",
        message: "Image or UID is unavailable",
      });
    }

    const gcs = storage.bucket("finsight-profile");
    const storagePath = `images/${uid}`;
    const filePath = file.path;

    // Upload to Google Cloud Storage
    await gcs.upload(filePath, {
      destination: storagePath,
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Clean up the local file
    fs.unlinkSync(filePath);

    // Construct the public URL
    const publicUrl = `https://storage.googleapis.com/finsight-profile/${storagePath}`;
    const batch = writeBatch(db);
    const userRef = doc(db, "users", uid);

    batch.update(userRef, {
      profileUrl: publicUrl,
    });

    await batch.commit();
    return res.status(200).json({
      status: "success",
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while uploading the image",
    });
  }
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

exports.getFollowers = async (req, res) => {
  try {
    const { uid } = req.params;

    const userRef = doc(db, "users", uid);

    const followersRef = collection(userRef, "followers");

    const followerSnapshot = await getDocs(followersRef);

    const followerIds = followerSnapshot.docs.map((doc) => doc.id);

    if (followerIds.length === 0) {
      return res.status(200).json({
        status: "success",
        followers: [],
      });
    }

    const userQuery = query(
      collection(db, "users"),
      where(documentId(), "in", followerIds)
    );

    const userSnapshot = await getDocs(userQuery);

    const followers = userSnapshot.docs.map((doc) => ({
      uid: doc.id,
      username: doc.data().username,
      profileUrl: doc.data().profileUrl,
    }));

    return res.status(200).json({
      status: "success",
      followers: followers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch followers.",
    });
  }
};

exports.getFollowings = async (req, res) => {
  try {
    const { uid } = req.params;

    const userRef = doc(db, "users", uid);

    const followersRef = collection(userRef, "followings");

    const followerSnapshot = await getDocs(followersRef);

    const followerIds = followerSnapshot.docs.map((doc) => doc.id);

    if (followerIds.length === 0) {
      return res.status(200).json({
        status: "success",
        followers: [],
      });
    }

    const userQuery = query(
      collection(db, "users"),
      where(documentId(), "in", followerIds)
    );

    const userSnapshot = await getDocs(userQuery);

    const followers = userSnapshot.docs.map((doc) => ({
      uid: doc.id,
      username: doc.data().username,
      profileUrl: doc.data().profileUrl,
    }));

    return res.status(200).json({
      status: "success",
      followings: followers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch followings.",
    });
  }
};

exports.chat = async (req, res) => {
  const { uidSender, uidReceiver, message } = req.body;

  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      uidSender: uidSender,
      uidReceiver: uidReceiver,
      message: message,
      createdAt: new Date(),
    });

    return res.status(200).json({
      status: "success",
      message: "Chat sent successfully!",
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: "Failed to send chat!",
    });
  }
};

exports.getChat = async (req, res) => {
  const { uidSender, uidReceiver } = req.params;

  try {
    const userSenderRef = doc(collection(db, "users"), uidSender);
    const uidReceiverRef = doc(collection(db, "users"), uidReceiver);

    const chatSnapshot = await getDocs(
      query(collection(db, "chats")),
      where("uidSender", "in", [uidSender, uidReceiver]),
      where("uidReceiver", "in", [uidSender, uidReceiver])
    );

    const messages = chatSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    messages.sort((a, b) => a.createdAt - b.createdAt);

    res.status(200).json({
      status: "success",
      chats: messages,
    });
  } catch (error) {}
};
