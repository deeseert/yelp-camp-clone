const Campground = require('../models/campground');
const Comment = require('../models/comment');


module.exports = {
  checkCampgroundOwnership: function (req, res, next) {
    if (req.isAuthenticated()) {
      Campground.findById(req.params.id, function (err, campground) {
        if (campground.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that!");
          console.log("BADD!!!");
          res.redirect("/campgrounds/" + req.params.id);
        }
      });
    } else {
      req.flash("error", "You need to be signed in to do that!");
      res.redirect("/login");
    }
  },


  // checkCommentOwnership: (req, res, next) => {
  //   const id = req.params.comment_id;
  //   if (req.isAuthenticated()) {
  //     Comment.findById(id)
  //       .then((foundComment) => {
  //         // does user own the comment?
  //         if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
  //           next();
  //         }
  //         res.redirect('back');
  //       })
  //       .catch((err) => {
  //         console.log('Err: ', err);
  //         res.redirect('back');
  //       })
  //   }
  //   req.flash('error', 'You don\'t have permission to do that!');
  //   res.redirect(`/campgrounds/${req.params.id}`);
  // },

  checkCommentOwnership: function (req, res, next) {
    console.log("YOU MADE IT!");
    if (req.isAuthenticated()) {
      Comment.findById(req.params.comment_id, function (err, comment) {
        if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that!");
          res.redirect("/campgrounds/" + req.params.id);
        }
      });
    } else {
      req.flash("error", "You need to be signed in to do that!");
      res.redirect("login");
    }
  },


  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) return next();

    req.flash('error', 'You need to be logged in to do that');
    res.redirect('/login');
  },

  isAdmin: (req, res, next) => {
    if (req.user.isAdmin) return next();

    req.flash('error', 'This site is now read only thanks to spam and trolls.');
    res.redirect('back');
  },

  isSafe: (req, res, next) => {
    if (req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
      next();
    } else {
      req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
      res.redirect('back');
    }
  }
};