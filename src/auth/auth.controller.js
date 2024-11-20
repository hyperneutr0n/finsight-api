//IMPORTS and INITIALIZATIONS
const { createUserWithEmailAndPassword } = require("@firebase/auth");
const {
  signInWithEmailAndPassword,
  sendEmailVerification,
} = require("firebase/auth");

const { signInWithPopUp, GoogleAuthProvider } = require("firebase/auth");
const { auth } = require("./firebase");
const admin = require("./firebase.admin");

const googleAuthProvider = new GoogleAuthProvider();

//LOGIN or REGISTER with Google
exports.googlelogin = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; //Authorization: Bearer <token>, take the first array to verify the token

  if (!token) {
    return res.status(401).json({
      message: "No token provided!",
    });
  }

  admin
    .auth()
    .verifyIdToken(token) //id token verifications from firebase-admin module
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      res.status(200).json({
        message: "Login successful!",
        uid: uid,
        email: email,
      });
    })
    .catch((error) => {
      const errorMessage = error.message;
      res.status(400).json({
        message: "Invalid credentials!",
        error: errorMessage,
      });
    });
};

//LOGIN normal
exports.login = (req, res) => {
  const { username, password } = req.body;

  signInWithEmailAndPassword(auth, username, password) //method used from firebase-auth module
    .then(async (userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified === true) {
        const token = await user.getIdToken();
        res.status(200).json({
          message: "Login successful!",
          user,
          token,
        });
      } else if (user.emailVerified === false) {
        sendEmailVerification(user)
          .then(() => {
            res.status(200).json({
              message: "Verify your email first, please check your email!",
            });
          })
          .catch((error) => {
            const errorMessage = error.message;
            res.status(400).json({
              message: "Failed to resend email verification, please try again!",
              error: errorMessage,
            });
          });
      }
    })
    .catch((error) => {
      const errorMessage = error.message;
      res.status(400).json({
        message: "Invalid credentials!",
        error: errorMessage,
      });
    });
};

//REGISTER
exports.register = (req, res) => {
  const { username, password } = req.body;

  createUserWithEmailAndPassword(auth, username, password) //method used from @firebase-auth module
    .then((userCredential) => {
      const user = userCredential.user;

      sendEmailVerification(user)
        .then(() =>
          res.status(200).json({
            message: "Registration succesful! Verification email sent.",
            user,
          })
        )
        .catch((error) => {
          const errorMessage = error.message;
          res.status(500).json({
            message:
              "Registration successful, failed to send email verification!",
            error: errorMessage,
          });
        });
    })
    .catch((error) => {
      const errorMessage = error.message;

      res.status(400).json({
        message: "Registration failed!",
        errorMessage,
      });
    });
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
