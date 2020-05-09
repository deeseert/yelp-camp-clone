const express = require('express');
const router = express.Router({ mergeParams: true });

const Campground = require('../models/campground');
const Comment = require('../models/comment');

//  Middleware checks if logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  res.redirect('/login');
};

router.get('/new', isLoggedIn, (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => res.render('comments/new', { campground }))
});

router.post('/', isLoggedIn, (req, res) => {
  const id = req.params.id;
  const campground = Campground.findById(id);
  const comment = Comment.create(req.body.comment);

  Promise.all([campground, comment])
    .then(([campground, comment]) => {
      comment.author.id = req.user._id;
      comment.author.username = req.user.username;
      comment.save();
      campground.comments.push(comment);
      campground.save()
        .then(() => res.redirect(`/campgrounds/${campground._id}`));
    })
    .catch((err) => console.log('Error while processing the comment: ', err))
});

module.exports = router;
