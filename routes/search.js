module.exports = function (req, res) {
  res.render("search", {q: req.query.q})
}
