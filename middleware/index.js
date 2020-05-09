Campground = require("../models/campground");

const middleware = {};

middleware.checkCampgroundOwnership = (req, res, next) => {
  const id = req.params.id;
  if (req.isAuthenticated()) {
    Campground.findById(id)
      .then((foundCampground) => {
        // does user own the campground?
        if (foundCampground.author.id.equals(req.user._id)) {
          next();
        } else {
          res.redirect("back");
        }
      })
      .catch((err) => {
        res.redirect("back");
      })
  } else {
    res.redirect("back");
  }
};

module.exports = middleware;