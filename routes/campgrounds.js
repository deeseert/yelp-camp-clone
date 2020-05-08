const express = require('express');
const router = express.Router();

const Campground = require('../models/campground');

router.get('/', (req, res) => {
  Campground.find({})
    .then((campgrounds) => res.render('campgrounds/index', { campgrounds }))
    .catch((err) => console.log('Error from fetching camps: ', err));
});

router.post('/', (req, res) => {
  const { name, image, description } = req.body;

  const newCampground = new Campground({
    name,
    image,
    description
  });

  newCampground.save()
    .then(() => res.redirect('/campgrounds'))
    .catch((err) => console.log('Error while saving: ', err))
});

router.get('/new', (req, res) => {
  res.render('campgrounds/new');
});

// Show route
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Campground.findById(id).populate('comments').exec() // populates the campground module with comments (one to many)
    .then((foundCampground) => {
      console.log('Campground found: ', foundCampground)
      return foundCampground;
    })
    .then((foundCampground) => res.render('campgrounds/show', { foundCampground }))
    .catch((err) => console.log('Error from findById: ', err))
});

module.exports = router;