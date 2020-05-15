const express = require('express');
const router = express.Router({ mergeParams: true });

const Campground = require('../models/campground');
const Comment = require('../models/comment');

const { checkCommentOwnership, isLoggedIn, isAdmin } = require("../middleware");
router.use(isLoggedIn);


router.get('/new', (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => res.render('comments/new', { campground }))
});

// Comments Create
router.post('/', (req, res) => {
  const id = req.params.id;
  const campground = Campground.findById(id);
  const comment = Comment.create({ comment: req.body.comment });

  Promise.all([campground, comment])
    .then(([campground, comment]) => {
      comment.author.id = req.user._id;
      comment.author.username = req.user.username;
      comment.save();
      campground.comments.push(comment);
      campground.save()
        .then(() => {
          req.flash('success', 'Comment created!');
          res.redirect(`/campgrounds/${campground._id}`)
        });
    })
    .catch((err) => console.log('Error while processing the comment: ', err))
});

// COMMENT EDIT ROUTE
router.get('/:comment_id/edit', checkCommentOwnership, (req, res) => {
  Comment.findById(req.params.comment_id)
    .then((comment) => {
      res.render('comments/edit', { campground_id: req.params.id, comment });
    })
    .catch(() => {
      res.redirect('back');
    });
});

// COMMENT UPDATE
router.put('/:comment_id', checkCommentOwnership, isAdmin, (req, res) => {
  Comment.findByIdAndUpdate(req.params.comment_id, { text: req.body.comment })
    .then(() => {
      res.redirect(`/campgrounds/${req.params.id}`);
    })
    .catch(() => {
      res.redirect('back');
    });
});

// COMMENT DESTROY ROUTE
router.delete('/:comment_id', checkCommentOwnership, isAdmin, (req, res) => {
  Comment.findByIdAndRemove(req.params.comment_id)
    .then(() => {
      res.redirect(`/campgrounds/${req.params.id}`);
    })
    .catch(() => {
      res.redirect('back');
    });
});

module.exports = router;
