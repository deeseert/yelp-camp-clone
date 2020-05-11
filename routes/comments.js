const express = require('express');
const router = express.Router({ mergeParams: true });

const Campground = require('../models/campground');
const Comment = require('../models/comment');

const middleware = require('../middleware');


router.get('/new', middleware.isLoggedIn, (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => res.render('comments/new', { campground }))
});

router.post('/', middleware.isLoggedIn, (req, res) => {
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

// COMMENT EDIT ROUTE
router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) => {
  Comment.findById(req.params.comment_id)
    .then((comment) => {
      res.render('comments/edit', { campground_id: req.params.id, comment });
    })
    .catch(() => {
      res.redirect('back');
    });
});

// COMMENT UPDATE
router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndUpdate(req.params.comment_id, { text: req.body.comment })
    .then(() => {
      res.redirect(`/campgrounds/${req.params.id}`);
    })
    .catch(() => {
      res.redirect('back');
    });
});

// COMMENT DESTROY ROUTE
router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndRemove(req.params.comment_id)
    .then(() => {
      res.redirect(`/campgrounds/${req.params.id}`);
    })
    .catch(() => {
      res.redirect('back');
    });
});

module.exports = router;
