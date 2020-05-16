const Campground = require('../models/campground');
const Comment = require('../models/comment');
const Review = require("../models/review");


module.exports = {
  checkCampgroundOwnership: function (req, res, next) {
    if (req.isAuthenticated()) {
      Campground.findOne({ slug: req.params.slug }, function (err, campground) {
        if (campground.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash('error', 'You don\'t have permission to do that!');
          console.log('BADD!!!');
          res.redirect('/campgrounds/' + req.params.id);
        }
      });
    } else {
      req.flash('error', 'You need to be signed in to do that!');
      res.redirect('/login');
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
    console.log('YOU MADE IT!');
    if (req.isAuthenticated()) {
      Comment.findById(req.params.comment_id, function (err, comment) {
        if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/campgrounds/' + req.params.id);
        }
      });
    } else {
      req.flash('error', 'You need to be signed in to do that!');
      res.redirect('login');
    }
  },


  isLoggedIn: (req, res, next) => {
    // if (req.isAuthenticated()) return next();

    // if (req['headers']['content-type'] === 'application/json') {
    //   return res.send({ error: 'Login required' });
    // }

    // req.flash('error', 'You need to be logged in to do that');
    // res.redirect('/login');

    next();
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
  },

  isPaid: (req, res, next) => {
    if (req.user && req.user.isPaid) return next();
    req.flash('error', 'Please pay registration fee before continuing');
    res.redirect('/checkout');
  },

  checkReviewOwnership: function (req, res, next) {
    if (req.isAuthenticated()) {
      Review.findById(req.params.review_id, function (err, foundReview) {
        if (err || !foundReview) {
          res.redirect("back");
        } else {
          // does user own the comment?
          if (foundReview.author.id.equals(req.user._id)) {
            next();
          } else {
            req.flash("error", "You don't have permission to do that");
            res.redirect("back");
          }
        }
      });
    } else {
      req.flash("error", "You need to be logged in to do that");
      res.redirect("back");
    }
  },

  checkReviewExistence: function (req, res, next) {
    if (req.isAuthenticated()) {
      Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
          req.flash("error", "Campground not found.");
          res.redirect("back");
        } else {
          // check if req.user._id exists in foundCampground.reviews
          var foundUserReview = foundCampground.reviews.some(function (review) {
            return review.author.id.equals(req.user._id);
          });
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.redirect("/campgrounds/" + foundCampground._id);
          }
          // if the review was not found, go to the next middleware
          next();
        }
      });
    } else {
      req.flash("error", "You need to login first.");
      res.redirect("back");
    }
  },



};