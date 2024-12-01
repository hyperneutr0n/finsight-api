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

exports.create = async (req, res) => {
  const { uid, title, content } = req.body;

  try {
    const docRef = await addDoc(collection(db, "posts"), {
      authorUid: uid,
      title: title,
      content: content,
      createdAt: new Date(),
      likes: 0,
    });

    return res.status(200).json({
      status: "success",
      message: "Post created successfully!",
    });
  } catch (error) {
    const errorMessage = error.message;

    return res.status(400).json({
      status: "failed",
      message: "Failed to create a post!",
    });
  }
};

exports.read = async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));

    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      status: "success",
      posts,
    });
  } catch (error) {
    const errorMessage = error.message;

    res.status(400).json({
      status: "failed",
      error: errorMessage,
    });
  }
};

exports.getFollowedPosts = async (req, res) => {
  const { uid } = req.body;

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

    return res.status(200).json({
      status: "success",
      posts,
    });
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      status: "fail",
      error: errorMessage,
    });
  }
};

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

exports.specificPosts = async (req, res) => {
  const { postId } = req.body;

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

    return res.status(200).json({
      status: "success",
      comments,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

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
    