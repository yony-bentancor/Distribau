// middlewares/auth.js
module.exports = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login.html"); // o "/"
  }
  next();
};
