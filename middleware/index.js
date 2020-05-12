const Campground = require('../models/campground');
const Comment = require('../models/comment');


module.exports = {
  checkCampgroundOwnership: (req, res, next) => {
    const id = req.params.id;

    if (req.isAuthenticated()) {
      Campground.findById(id)
        .then((foundCampground) => {
          // does user own the campground?
          if (foundCampground.author.id.equals(req.user._id)) {
            next();
          }
          res.redirect('back');
        })
        .catch((err) => {
          console.log('Err: ', err);
          res.redirect('back');
        })
    }

    req.flash('error', 'You don\'t have permission to do that!');
    res.redirect(`/campgrounds/${req.params.id}`);

  },

  checkCommentOwnership: (req, res, next) => {
    const id = req.params.comment_id;
    if (req.isAuthenticated()) {
      Comment.findById(id)
        .then((foundComment) => {
          // does user own the comment?
          if (foundComment.author.id.equals(req.user._id)) {
            next();
          }
          res.redirect('back');
        })
        .catch((err) => {
          console.log('Err: ', err);
          res.redirect('back');
        })
    }
    req.flash('error', 'You don\'t have permission to do that!');
    res.redirect(`/campgrounds/${req.params.id}`);
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