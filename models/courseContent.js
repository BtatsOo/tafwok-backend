const mongoose = require("mongoose");
const Course = require("../models/course");
const courseContentSchema = new mongoose.Schema({
  title: String,
  description: String,

  duration: Number,
  featuredImage: String,
  price: Number,

  content: [
    {
      topic: [
        {
          title: String,
          description: String,
          lessons: [
            {
              url: String,
              title: String, // Optional: title for each lesson if needed
              duration: Number, // Optional: duration for each lesson if needed
            },
          ],
          docs: {},
        },
      ],
    },
  ],
});

module.exports = mongoose.model("courseContent", courseContentSchema);
