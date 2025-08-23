const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/course");
const router = express.Router();
const cookieParser = require("cookie-parser");
const Student = require("../models/student");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const student = require("../models/student");
// functions
async function getStudent(req, res, next) {
  let student;
  try {
    student = await Student.findById(req.params.id);
    if (student === null) {
      return res.status(404).json({ message: "Couldnt Find Student Account" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.student = student;
  next();
}
async function authentcationToken(req, res, next) {
  const existingToken = req.cookies.accessToken;
  if (existingToken) {
    jwt.verify(existingToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token", user: null });
      }
      req.user = user;
    });
  } else {
    req.user = null;
  }
  next();
}

router.use(cookieParser());
// Getting one
// get to home page !
router.get("/", authentcationToken, async (req, res) => {
  const userCurrentVersion = await Student.findById(req.user?._id);

  res.status(203).json({ userCurrentVersion });
});
// Creating One // register
router.post("/register", async (req, res) => {
  const student = new Student({
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    phoneNumber: req.body.phoneNumber,
    guardianPhone: req.body.guardianPhone,
    city: req.body.city,
    balance: 250,
    class: req.body.class1,
  });
  try {
    const newStudent = await student.save(); //await stop code under it if u forgot!
    const accesstoken = jwt.sign(
      newStudent.toObject(),
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    ); //cookies
    res.cookie("accessToken", accesstoken, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: true, // Ensures the cookie is only sent over HTTPSprocess.env.NODE_ENV === "production"
      sameSite: "None", // Helps prevent CSRF attacks
    });

    res
      .status(200)
      .json({ accesstoken: accesstoken, message: "successfully Created" });
    console.log("successfully Created", newStudent);
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
});

//check if user have a avalid token and dont need to go to login page again!
router.get("/login", async (req, res) => {
  const existingToken = req.cookies.accessToken;
  if (existingToken) {
    jwt.verify(existingToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return (req.err = "invalid Token ");
      }
      req.user = user;
    });
    if (req.err) {
      return res.status(404).json({ message: "Invalid token", user: "null" });
    }
    const userCurrentVersion = await Student.findById(req.user?._id);
    // res.redirect("/");// get to home page
    res.json({
      message: "Access granted to protected route,uve logged in before ",
      user: userCurrentVersion,
    });
  } else {
    return res.json({ user: null });
  }
});

// student login
router.post("/login", async (req, res) => {
  const { name, password } = req.body;
  console.log(name, password);
  const studentsInDB = await Student.find();
  const user = studentsInDB.find((stu) => stu.name === name); // if not it return undefind
  if (!user) {
    return res.status(404).json({ message: "Invalid UserName" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  const accesstoken = jwt.sign(
    user.toObject(),
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "24h" }
  ); //cookies
  res.cookie("accessToken", accesstoken, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: true, // Ensures the cookie is only sent over HTTPSprocess.env.NODE_ENV === "production"
    sameSite: "None", // Helps prevent CSRF attacks
  });
  res.json({ accesstoken: accesstoken });
});
// students log out
router.get("/logout", (req, res) => {
  // Set the cookie with an expired date to delete it
  res.cookie("accessToken", "", {
    expires: new Date(0), // Set the expiration date to a past date
    httpOnly: true, // Ensure it's not accessible via JavaScript
    secure: false, //process.env.NODE_ENV === "production", // Send only over HTTPS in production
    sameSite: "Strict", // Prevent CSRF attacks
    path: "/", // Ensure the path matches the cookie's original path
  });
  res.send("Cookie deleted and logged out");
});
router.patch("/checkpoint", authentcationToken, async (req, res) => {
  try {
    const { lessonId, checkpointArray, timeDiff } = req.body;
    const userId = req.user?._id;
    console.log(userId, "userId");

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user
    const user = await Student.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found, please sign in!" });
    }

    // normalize checkpoints array
    const checkpoints = Array.isArray(checkpointArray)
      ? checkpointArray
      : [checkpointArray];

    // find the watched lesson entry if exists
    let lesson = user.watchedLessons.find(
      (wl) => wl.lessonId.toString() === lessonId.toString()
    );

    if (lesson) {
      // lesson exists
      if (timeDiff >= 24 || lesson.sessions.length === 0) {
        // ⏰ more than 24h (new session)
        lesson.sessions.push({ reached: checkpoints });
        lesson.count = (lesson.count || 0) + 1; // increment count for new session
      } else {
        // ⏰ same day (overwrite last session only)
        const lastSession = lesson.sessions[lesson.sessions.length - 1];
        lastSession.reached.addToSet(...checkpoints);
        lastSession.At = new Date();
      }
    } else {
      // lesson not tracked yet → create a new entry
      user.watchedLessons.push({
        lessonId,
        count: 1,
        sessions: [{ reached: checkpoints }],
      });
    }

    // save user
    await user.save();

    res.json({ message: "Checkpoint updated successfully!" });
  } catch (err) {
    console.error("Checkpoint error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Updating One
router.patch("/:id", (req, res) => {});
// Deleting One (b3deen)

// const existingToken = req.cookies.accessToken;
// if (existingToken) {
//   jwt.verify(existingToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ message: "Invalid token" });
//     }
//     req.user = user;
//   });
//   res.json({ message: "Access granted to protected route", user: req.user });
//   return;
// } // great logic بس ملوش لازمة لان المستخدم مش هيقدر يخش  على البوست قبل الجيت
module.exports = router;
