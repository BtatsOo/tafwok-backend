const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/course");
const QuizResult = require("../models/quizResult"); // import schema

const authentcationToken = require("./authToken");
const courseContent = require("../models/courseContent");
const Student = require("../models/student");
//getting all
router.get("/", async (req, res) => {
  try {
    const courses = await courseContent.find();

    courses.forEach((course) => {
      course.content = null;
    });

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
    // check after validate cast
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Course not found" });
    }
    console.log(courses, "courses");
    courses.content.forEach((contentItem) => {
      contentItem &&
        contentItem.lessons.forEach((lesson) => {
          lesson.url = null;
          if (lesson.lessonType === "quiz") {
            lesson.questions = null;
          }
        });
    });
    res.json(courses);
  } catch (err) {
    // check cast error !
    if (err instanceof mongoose.Error.CastError) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(404).json({ message: err.message });
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
      provider: req.body.provider,
      category: req.body.category,
      featuredImage: req.body.featuredImage,
      originalPrice: req.body.originalPrice,
      features: req.body.features,

      content: req.body.content.map((topicData) => ({
        title: topicData.title,
        description: topicData.description,
        lessons: topicData.lessons.map((lessonData) => ({
          url: lessonData.url,
          title: lessonData.title,
          duration: lessonData.duration,
          lessonType: lessonData.lessonType,
          questions: lessonData?.questions?.map((question) => ({
            title: question.title,
            questionOptions: question.questionOptions.map((qp) => ({
              title: qp.title,
              correctValue: qp.correctValue,
            })),
          })),
        })),
        docs: topicData.docs || {},
      })),
    });

    try {
      const newCourse = await courseContent1.save();
      res.status(200).json({ message: "successfully created !", newCourse });
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
      res.json({ message: "error course content is invalid!" });
    }
  } else {
    res.status(403).json({ message: "You Dont Have Access To This Course !" });
  }
});
//get access to quiz by its id
router.get(
  "/enroll/:id/quiz/enroll/:lessonId",
  authentcationToken,
  async (req, res) => {
    console.log(req.params);
    const lessonId = req.params.lessonId;
    const user = await Student.findById(req.user?._id);
    const haspurchased = user?.enrolledCourses.includes(req.params.lessonId);
    if (user?.enrolledCourses.includes(req.params.id)) {
      try {
        const courseContentenrolled = await courseContent.findById(
          req.params.id
        );

        // Find the specific lesson by ID
        const lessons = courseContentenrolled.content.flatMap(
          (contentData) => contentData.lessons
        );
        console.log("lessons", lessons);

        const quizLesson = lessons.find((lesson) => {
          return (
            lesson._id.toString() === lessonId && lesson.lessonType === "quiz"
          );
        });
        quizLesson.questions.forEach((question) => {
          question.questionOptions.forEach((option) => {
            option.correctValue = null;
          });
        });
        console.log("lesson", quizLesson);
        //   if (lesson) {
        //     res.json({ message: "Lesson found", lesson });
        //   } else {
        //     res.status(404).json({ message: "Lesson not found" });
        //   }
        // }

        res.json({
          message: "successfly enrolled",
          quizLesson,
        });
      } catch (err) {
        res.json({ message: "err" });
      }
    } else {
      res
        .status(403)
        .json({ message: "You Dont Have Access To This Course !" });
    }
  }
);

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
        { new: true, runValidators: true } //new :true return the updated document
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

// calculate Quiz Result !
router.post(
  "/enroll/:id/quiz/enroll/:lessonId/result",
  authentcationToken,
  async (req, res) => {
    const courseId = req.params.id;
    const lessonId = req.params.lessonId;
    const { answers } = req.body;
    try {
      const user = await Student.findById(req.user?._id);
      console.log(user, "user/////////////");

      if (!user?.enrolledCourses.includes(courseId)) {
        return res
          .status(403)
          .json({ message: "Not enrolled in this course." });
      }

      const courseContentEnrolled = await courseContent.findById(courseId);
      const allLessons = courseContentEnrolled.content.flatMap(
        (contentData) => contentData.lessons
      );

      const quizLesson = allLessons.find(
        (lesson) =>
          lesson._id.toString() === lessonId && lesson.lessonType === "quiz"
      );

      if (!quizLesson) {
        return res.status(404).json({ message: "Quiz lesson not found." });
      }

      let correctCount = 0;
      let wrongQuestions = [];

      for (const answer of answers) {
        const question = quizLesson.questions.find(
          (q) => q._id.toString() === answer.questionId
        );

        if (!question) continue;

        const correctOption = question.questionOptions.find(
          (opt) => opt.correctValue === true
        );
        const selectedOption = question.questionOptions.find(
          (opt) => opt._id.toString() === answer.selectedOptionId
        );

        if (correctOption && selectedOption) {
          if (selectedOption._id.toString() === correctOption._id.toString()) {
            correctCount++;
          } else {
            wrongQuestions.push({
              questionId: question._id,
              questionTitle: question.title,
              selectedOption: selectedOption.title,
              correctOption: correctOption.title,
            });
          }
        }
      }

      const total = quizLesson.questions.length;
      const scorePercentage = (correctCount / total) * 100;

      // حفظ النتيجة في الداتابيز
      const quizResultDB = await QuizResult.create({
        student: req.user._id,
        courseData: courseId,
        lessonId,
        score: Number(scorePercentage.toFixed(2)),
        totalQuestions: total,
        correctAnswers: correctCount,
        wrongAnswers: total - correctCount,
        wrongQuestions,
      });

      return res.json({
        totalQuestions: total,
        correctAnswers: correctCount,
        wrongAnswers: total - correctCount,
        score: scorePercentage.toFixed(2) + "%",
        wrongQuestions,
      });
    } catch (error) {
      console.error("Quiz result error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// get the results of quiz of students !
// جلب كل نتائج الامتحانات الخاصة بالطالب
router.get("/myquiz/results", authentcationToken, async (req, res) => {
  try {
    // Step 1: هات نتائج الطالب مع معلومات الكورس
    const results = await QuizResult.find({ student: req.user._id })
      .select("-__v")
      .populate({ path: "courseData", select: "title content" }) // نحتاج content عشان الدروس
      .sort({ createdAt: -1 });

    // Step 2: تجهيز النتائج مع أسماء الدروس
    const enrichedResults = results.map((result) => {
      let lessonTitle = "غير معروف";
      const course = result.courseData;

      if (course?.content) {
        const allLessons = course.content.flatMap((topic) => topic.lessons);
        const foundLesson = allLessons.find(
          (lesson) => lesson._id.toString() === result.lessonId.toString()
        );
        if (foundLesson) {
          lessonTitle = foundLesson.title;
        }
      }

      return {
        _id: result._id,
        score: result.score,
        createdAt: result.createdAt,
        courseTitle: course?.title || "غير معروف",
        lessonTitle,
        student: result.student,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        wrongQuestions: results.wrongQuestions,
      };
    });

    return res.json(enrichedResults);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
