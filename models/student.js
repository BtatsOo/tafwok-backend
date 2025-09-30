const mongoose = require("mongoose");
const Course = require("../models/course");
const courseContent = require("../models/courseContent");

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
  guardianPhone: {
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
  class: {
    type: String,
    unique: true,
  },
  watchedLessons: [
    {
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
      lessonName: { type: String },
      count: { type: Number, default: 0 },
      sessions: [
        {
          reached: [Number],
          At: { type: Date, default: Date.now }, // checkpoints for that session
        },
      ],
    },
  ],
  events: [{ title: String, date: String }],
});

module.exports = mongoose.model("Student", studentSchema);
