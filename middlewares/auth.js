// middlewares/auth.js
module.exports = function (req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  next();
};
