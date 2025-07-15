const mongoose = require("mongoose");
const Course = require("../models/course");

const courseContentSchema = new mongoose.Schema({
  title: String,
  provider: String,
  category: String,
  description: String,

  duration: String,
  featuredImage: String,
  price: Number,
  originalPrice: Number,
  features: [String],

  content: [
    {
      title: String,
      description: String,
      lessons: [
        {
          url: String,
          title: String, // Optional: title for each lesson if needed
          duration: Number, // Optional: duration for each lesson if needed
          lessonType: String, //lesson type : quiz, homework, lesson,docs
          questions: [
            {
              title: String,
              questionOptions: [
                {
                  title: String,
                  correctValue: { type: Boolean, default: false },
                },
              ],
            },
          ],
        },
      ],

      docs: {},
    },
  ],
});

module.exports = mongoose.model("courseContent", courseContentSchema);
