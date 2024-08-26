const mongoose = require("mongoose");
const CourseContent = require("../models/courseContent");
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number,
  price: Number,
});
module.exports = mongoose.model("Course", courseSchema);
