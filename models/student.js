const mongoose = require("mongoose");
const Course = require("../models/course");
const courseContent = require("../models/courseContent");
const { type } = require("@testing-library/user-event/dist/type");
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 9,
  },
  city: {
    type: String, // Define the city as a string
    required: true, // Optional: Add validation if city is required
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courseContent", // Assuming you have a Course model
    },
  ],
  balance: Number,
});

module.exports = mongoose.model("Student", studentSchema);
