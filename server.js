require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:3001", process.env.FRONT_URI], // Replace with your frontend's origin
    credentials: true, // Allow credentials (cookies) to be sent}));
  })
);

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err, "errors");
});
// const authentcationToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];
//   if (token === null) return res.status(401).json("There No Token");
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     console.log(req.user);
//     next();
//   });
// };
app.use(express.json());
// app.get("/users", authentcationToken, (req, res) => {});
// app.post("/login", (req, res) => {
//   const user = { username: req.body.username };
//   const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
//   res.json({ accesstoken: accesstoken });
// });
//return the user after verify it
const studentsRoutes = require("./routes/students");
app.use("/", studentsRoutes);
const coursesRoutes = require("./routes/courses");
app.use("/courses", coursesRoutes);
const chekout = require("./routes/checkout");
app.use("/", chekout);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server Is Connected"));
