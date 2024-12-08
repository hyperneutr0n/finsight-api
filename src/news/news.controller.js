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

exports.fetch = async (req, res) => {
  try {
    const date = req.params.date;
    const newsRef = collection(db, "news");
    const newsSnapshot = await getDocs(
      query(newsRef, where("createdAt", "==", date))
    );

    const news = newsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      status: "success",
      news: news,
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      error: error.message,
    });
  }
};
