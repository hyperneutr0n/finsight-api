//IMPORTS and INITIALIZATIONS
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

//LOGIN normal
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
        message: "Login successful!",
        user,
        token,
      });
    } else if (user.emailVerified === false) {
      await sendEmailVerification(user);
      return res.status(400).json({
        message: "Verify your email first, please check your email!",
      });
    }
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      message: "Invalid credentials!",
      error: errorMessage,
    });
  }
};

//REGISTER
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
      //adding user
      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, {
        username: user.email,
        createdAt: new Date(),
        profileRisk: "",
      });

      try {
        // send michat
        await sendEmailVerification(user);
        return res.status(200).json({
          message: "Registration successful! Verification email sent.",
          user,
        });
      } catch (error) {
        const errorMessage = error.message;
        return res.status(500).json({
          message:
            "Registration successful, but failed to send email verification!",
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error.message;
      return res.status(500).json({
        message: "Failed to add user data to Firestore!",
        error: errorMessage,
      });
    }
  } catch (error) {
    const errorMessage = error.message;
    return res.status(400).json({
      message: "Registration failed!",
      errorMessage,
    });
  }
};

exports.test = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract the token from the Authorization header

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token missing or invalid" });
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      res.status(200).json({ message: "Authenticated successfully", uid: uid });
    })
    .catch((error) => {
      res.status(401).json({ message: "Invalid token", error: error.message });
    });
};
