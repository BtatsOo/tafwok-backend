// models/quizResult.js
const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courseContent",
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,

    required: true,
  },
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  wrongQuestions: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      questionTitle: String,
      selectedOption: String,
      correctOption: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
