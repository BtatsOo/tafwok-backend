const jwt = require("jsonwebtoken");

const authentcationToken = async function (req, res, next) {
  const existingToken = req.cookies.accessToken;
  if (existingToken) {
    jwt.verify(existingToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(404).json({ message: "Invalid token", user: null });
      }
      req.user = user;
      console.log(user);
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
};
module.exports = authentcationToken;
