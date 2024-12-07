const { auth, db } = require("../firebase");

const admin = require("../firebase.admin");

const {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  increment,
} = require("firebase/firestore");

const fs = require("fs");

const { Storage } = require("@google-cloud/storage");

const crypto = require("crypto");
const { post } = require("selenium-webdriver/http");

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.PROFILE_BUCKET_KEY,
});

const bucket = storage.bucket("finsight-profile");

/**
 * @method create
 *
 * @description
 * Create post in finsight's social
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.create = async (req, res) => {
  const { uid, title, content } = req.body;
  const file = req.file;

  try {
    const docRef = await addDoc(collection(db, "posts"), {
      authorUid: uid,
      title: title,
      content: content,
      createdAt: new Date(),
      likes: 0,
    });

    const postId = docRef.id;

    const gcs = storage.bucket("finsight-profile");
    const storagePath = `posts/${postId}`;
    const filePath = file.path;

    await gcs.upload(filePath, {
      destination: storagePath,
      metadata: {
        contentType: file.mimetype,
      },
    });

    fs.unlinkSync(filePath);

    const publicUrl = `https://storage.googleapis.com/finsight-profile/${storagePath}`;

    const postDocRef = doc(db, "posts", postId);

    await setDoc(
      postDocRef,
      {
        postUrl: publicUrl,
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Post created successfully!",
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: "Failed to create a post!",
      error: error.message,
    });
  }
};

/**
 * @method read
 *
 * @description
 * Get all posts in finsight's social
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
        message: "UID is required!",
      });
    }

    //GET POSTS
    const postQuerySnapshot = await getDocs(collection(db, "posts"));

    //QUERY likes based on UID
    const likeQuerySnapshot = await getDocs(
      query(collection(db, "likes"), where("authorUid", "==", uid))
    );

    //SET the results
    const likePostIds = new Set(
      likeQuerySnapshot.docs.map((doc) => doc.data().postId)
    );

    //MAP posts to add data of isLiked
    const posts = postQuerySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      liked: likePostIds.has(doc.id),
    }));

    //SET of author UIDS
    const authorUids = [...new Set(posts.map((post) => post.authorUid))];

    let userMap = {};

    let profileUrl = {};

    //MAPPING username to usermap based on UID
    if (authorUids.length > 0) {
      const userDocs = await Promise.all(
        authorUids.map((authorUid) => getDoc(doc(db, "users", authorUid)))
      );

      userDocs.forEach((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          console.log(userData);
          userMap[doc.id] = userData.username;
          profileUrl[doc.id] = userData.profileUrl;
        }
      });
    }

    //MAPPING to add data
    const postsWithUsernames = posts.map((post) => ({
      ...post,
      username: userMap[post.authorUid],
      profileUrl: profileUrl[post.authorUid],
    }));

    //COLLECTION
    const followingRef = collection(doc(db, "users", uid), "followings");
    const followingSnapshot = await getDocs(followingRef);
    const followingUidSet = new Set(
      followingSnapshot.docs.map((doc) => doc.id)
    );

    //MAPPING to add data
    const postsWithUsernamesAndFollowStatus = postsWithUsernames.map(
      (post) => ({
        ...post,
        isFollowed: followingUidSet.has(post.authorUid),
      })
    );

    res.status(200).json({
      status: "success",
      posts: postsWithUsernamesAndFollowStatus,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      error: error.message,
    });
  }
};

/**
 * @method getFollowedPosts
 *
 * @description
 * Get all specified user's posts in finsight's social
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.getFollowedPosts = async (req, res) => {
  const { uid } = req.params;

  try {
    const followingRef = collection(doc(db, "users", uid), "followings");

    const followingSnapshot = await getDocs(followingRef);
    const followingUid = followingSnapshot.docs.map((doc) => doc.id);

    if (followingUid.length === 0) {
      return res.status(200).json({
        status: "success",
        posts: [],
      });
    }

    const postsQuery = query(
      collection(db, "posts"),
      where("authorUid", "in", followingUid)
    );

    const postSnapshot = await getDocs(postsQuery);

    const posts = postSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    //map the author uids for each post
    const authorUids = [...new Set(posts.map((post) => post.authorUid))];

    let userMap = {};

    let profileUrl = {};

    if (authorUids.length > 0) {
      const userDocs = await Promise.all(
        authorUids.map((authorUid) => getDoc(doc(db, "users", authorUid)))
      );

      userDocs.forEach((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          userMap[doc.id] = userData.username;
          profileUrl[doc.id] = userData.profileUrl;
        }
      });
    }

    const postsWithUsernames = posts.map((post) => ({
      ...post,
      username: userMap[post.authorUid],
      profileUrl: profileUrl[post.authorUid],
    }));

    return res.status(200).json({
      status: "success",
      posts: postsWithUsernames,
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      status: "fail",
      error: errorMessage,
    });
  }
};

/**
 * @method addComment
 *
 * @description
 * Add a comment to a specified post
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.addComment = async (req, res) => {
  const { postId, uid, content } = req.body;

  try {
    const docRef = await addDoc(collection(db, "comments"), {
      postId: postId,
      authorUid: uid,
      content: content,
      createdAt: new Date(),
    });

    return res.status(200).json({
      status: "success",
      message: "Comment added successfully!",
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

/**
 * @method specificPosts
 *
 * @description
 * Get all comments on specified posts in finsight's social
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.specificPosts = async (req, res) => {
  const { postId } = req.params;

  try {
    const commentsQuery = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const commentSnapshot = await getDocs(commentsQuery);

    const comments = commentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const authorUids = [
      ...new Set(comments.map((comment) => comment.authorUid)),
    ];

    let userMap = {};
    let profileUrl = {};

    if (authorUids.length > 0) {
      const userDocs = await Promise.all(
        authorUids.map((authorUid) => getDoc(doc(db, "users", authorUid)))
      );

      userDocs.forEach((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          userMap[doc.id] = userData.username;
          profileUrl[doc.id] = userData.profileUrl;
        }
      });
    }

    const commentsWithUsername = comments.map((doc) => ({
      ...doc,
      username: userMap[doc.authorUid],
      profileUrl: profileUrl[doc.authorUid],
    }));

    return res.status(200).json({
      status: "success",
      comments: commentsWithUsername,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

/**
 * @method like
 *
 * @description
 * Like a specified post
 *
 * @return {JSON}
 * JSON Formatted responses
 *
 * @see
 * {@link https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub Finsight API Documentation}
 */
exports.like = async (req, res) => {
  const { uid, postId } = req.body;
  try {
    const batch = writeBatch(db);

    const likeRef = collection(db, "likes");

    const postRef = doc(db, "posts", postId);

    if (!postRef) {
      console.error("Invalid post reference");
      return res.status(400).json({ error: "Invalid post reference" });
    }
    const checkExistingLike = query(
      likeRef,
      where("authorUid", "==", uid),
      where("postId", "==", postId)
    );

    const existingLikeSnapshot = await getDocs(checkExistingLike);

    if (!existingLikeSnapshot.empty) {
      const likeDocId = existingLikeSnapshot.docs[0].id;
      const likeDocRef = doc(db, "likes", likeDocId);
      batch.delete(likeDocRef);
      batch.update(postRef, {
        likes: increment(-1),
      });

      await batch.commit();

      return res.status(200).json({
        status: "success",
        message: "Like removed!",
      });
    }

    const likeDocRef = doc(likeRef);

    batch.set(likeDocRef, {
      authorUid: uid,
      postId: postId,
      createdAt: new Date(),
    });

    batch.update(postRef, {
      likes: increment(1),
    });

    await batch.commit();

    return res.status(200).json({
      status: "success",
      message: "Like added to the post!",
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      error: error.message,
    });
  }
};
