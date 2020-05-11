const Campground = require('../models/campground');
const Comment = require('../models/comment');

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
          res.redirect('back');
        }
      })
      .catch((err) => {
        res.redirect('back');
      })
  } else {
    res.redirect('back');
  }
};

middleware.checkCommentOwnership = (req, res, next) => {
  const id = req.params.comment_id;
  if (req.isAuthenticated()) {
    Comment.findById(id)
      .then((foundComment) => {
        // does user own the comment?
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          res.redirect('back');
        }
      })
      .catch((err) => {
        res.redirect('back');
      })
  } else {
    res.redirect('back');
  }
};

middleware.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  res.redirect('/login');
};



module.exports = middleware;