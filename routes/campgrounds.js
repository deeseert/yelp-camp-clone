const express = require('express');
const router = express.Router();

const Campground = require('../models/campground');
const middleware = require('../middleware');


router.get('/', (req, res) => {
  Campground.find({})
    .then((campgrounds) => res.render('campgrounds/index', { campgrounds }))
    .catch((err) => console.log('Error from fetching camps: ', err));
});

router.post('/', middleware.isLoggedIn, (req, res) => {
  const { name, image, description } = req.body;
  const author = {
    id: req.user._id,
    username: req.user.username
  };

  const newCampground = new Campground({
    name,
    image,
    description,
    author
  });

  newCampground.save()
    .then(() => res.redirect('/campgrounds'))
    .catch((err) => console.log('Error while saving: ', err))
});

router.get('/new', middleware.isLoggedIn, (req, res) => {
  res.render('campgrounds/new');
});

// Show single campground
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Campground.findById(id).populate('comments').exec() // populates the campground module with comments (one to many)
    .then((foundCampground) => {
      return foundCampground;
    })
    .then((foundCampground) => res.render('campgrounds/show', { foundCampground }))
    .catch((err) => console.log('Error from findById: ', err))
});

// Show Edit form
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => {
      res.render('campgrounds/edit', { campground });
    })
  // .catch((err) => {
  //   console.log('Error in showing the edit form: '.err);
  //   res.redirect('/campgrounds');
  // })
});

// Update Campground
router.put('/:id', middleware.checkCampgroundOwnership, (req, res) => {
  const { name, image, description } = req.body;
  const id = req.params.id;

  const newCampgroundData = {
    name,
    image,
    description
  };

  Campground.findByIdAndUpdate(id, newCampgroundData)
    .then((campgroundUpdated) => {
      res.redirect(`/campgrounds/${id}`);
    })
    .catch((err) => {
      res.redirect('/campgrounds');
    });
});

// Delete
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) => {
  const id = req.params.id;
  Campground.findByIdAndRemove(id)
    .then(() => res.redirect('/campgrounds'))
    .catch(() => res.redirect('/campgrounds'))
});

module.exports = router;