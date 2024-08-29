const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/course");
const router = express.Router();
const cookieParser = require("cookie-parser");
const Student = require("../models/student");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    city: req.body.city,
  });
  try {
    const newStudent = await student.save(); //await stop code under it if u forgot!
    res.status(200).json("successfully Created");
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
    { expiresIn: "1h" }
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
    secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
    sameSite: "Strict", // Prevent CSRF attacks
    path: "/", // Ensure the path matches the cookie's original path
  });
  res.send("Cookie deleted and logged out");
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
