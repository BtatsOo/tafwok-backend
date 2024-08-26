const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/course");

const authentcationToken = require("./authToken");
const courseContent = require("../models/courseContent");
const Student = require("../models/student");
//getting all
router.get("/", async (req, res) => {
  try {
    const courses = await courseContent.find();
    res.json(courses);
  } catch (err) {
    res.json({ message: err.message });
  }
});
//get enrolled courses
router.get("/enrolled-courses", authentcationToken, async (req, res) => {
  const user = await Student.findById(req.user?._id);
  if (!user) {
    return res.status(404).json({ loginUser: false, message: "Please Login" });
  }
  try {
    const { enrolledCourses } = await Student.findById(req.user?._id).populate({
      path: "enrolledCourses",
      model: "courseContent",
    });
    res.status(200).json({ enrolledCourses: enrolledCourses });
  } catch (error) {
    res.json({ message: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const courses = await courseContent.findById(req.params.id);
    // console.log(courses.content);
    courses.content.forEach((contentItem) => {
      contentItem.topic &&
        contentItem.topic.forEach((topicItem) => {
          topicItem.lessons.forEach((lesson) => {
            lesson.url = null;
          });
        });
    });
    res.json(courses);
  } catch (err) {
    res.json({ message: err.message });
  }
});
// create one
router.post("/create-course", async (req, res) => {
  const course = new Course({
    title: req.body.title,
    description: req.body.description,
    duration: req.body.duration,
  });

  try {
    const newCourse = await course.save();
    console.log("successfully Created", newCourse);
  } catch (err) {
    res.json({ message: err.message });
  }
});
router.post("/create-course-content", authentcationToken, async (req, res) => {
  if (
    req.user?.name === "admin" &&
    req.user._id === "66bb5695e463dbd49ddf0442"
  ) {
    const courseContent1 = new courseContent({
      title: req.body.title,
      description: req.body.description,
      duration: req.body.duration,
      price: req.body.price,

      content: req.body.content.map((topicData) => ({
        topic: {
          title: topicData.topic.title,
          description: topicData.topic.description,
          lessons: topicData.topic.lessons.map((lessonData) => ({
            url: lessonData.url,
            title: lessonData.title,
            duration: lessonData.duration,
          })),
          docs: topicData.topic.docs || {},
        },
      })),
    });

    try {
      const newCourse = await courseContent1.save();
      console.log("successfully Created", newCourse);
    } catch (err) {
      res.json({ message: err.message });
    }
  } else {
    res.json({ message: "you dont have permission to create course!" });
  }
});
//get access to course content based on id
router.get("/enroll/:id", authentcationToken, async (req, res) => {
  const user = await Student.findById(req.user?._id);
  const haspurchased = user?.enrolledCourses.includes(req.params.id);

  console.log({ ifcsd: haspurchased });
  if (user?.enrolledCourses.includes(req.params.id)) {
    try {
      const courseContentenrolled = await courseContent.findById(req.params.id);

      res.json({ message: "successfly enrolled", courseContentenrolled });
    } catch (err) {
      res.json({ message: "error course content in invalid!" });
    }
  } else {
    res.status(403).json({ message: "You Dont Have Access To This Course !" });
  }
});
// purchase a course (push into enrolled courses )
router.patch("/purchase/:id", authentcationToken, async (req, res) => {
  try {
    const user = await Student.findById(req.user?._id);
    if (!user) {
      return res
        .status(404)
        .json({ loginUser: false, message: "Please Login" });
    }
    if (user.enrolledCourses.includes(req.params.id)) {
      return res.json({ message: "You Have Already Purchased This Course!" });
    }
    const courseContentenrolled = await courseContent.findById(req.params.id);
    console.log(courseContentenrolled);

    if (!courseContentenrolled) {
      return res.status(404).json({ message: "Course not found" });
    }
    const price = courseContentenrolled.price;
    if (user.balance >= price) {
      user.balance -= price;
      console.log(user);
      const updatedUser = await Student.findByIdAndUpdate(
        req.user._id,
        {
          $addToSet: { enrolledCourses: req.params.id },
          $set: { balance: user.balance },
        },
        { new: true, runValidators: true }
      );
      res.json(updatedUser);
    } else {
      res.status(400).json({ message: "Insufficient balance" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred please sign in " });
  }
});
module.exports = router;
