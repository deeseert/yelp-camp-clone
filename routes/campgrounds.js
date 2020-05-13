const express = require('express');
const router = express.Router();
const NodeGeocoder = require('node-geocoder');
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

const Campground = require('../models/campground');
const middleware = require('../middleware');


// Define escapeRegex function for search feature
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

console.log('Env from campgrounds.js: ', process.env.GEOCODER_API_KEY);

// Get all Campgrounds
router.get('/', (req, res) => {
  Campground.find({})
    .then((campgrounds) => {

      if (req.query.search && req.xhr) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({ name: regex })
          .then((allCampgrounds) => {
            res.status(200).json(allCampgrounds);
          })
          .catch((err) => console.log(err))
      }

      if (req.xhr) {
        res.json(allCampgrounds);
      }

      res.render('campgrounds/index', { campgrounds, page: 'campgrounds' })
    })
    .catch((err) => console.log('Error from fetching camps: ', err));
});

// Create Campground
router.post('/', middleware.isLoggedIn, middleware.isSafe, (req, res) => {
  const { name, image, description, cost } = req.body;
  const author = {
    id: req.user._id,
    username: req.user.username
  };

  geocoder.geocode(req.body.location, (err, data) => {
    console.log('Data from Geo: ', data);
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    const lat = data[0].latitude;
    const lng = data[0].longitude;
    const location = data[0].formattedAddress;

    const newCampground = new Campground({
      name,
      image,
      description,
      cost,
      author,
      lat,
      lng,
      location
    });

    // Campground.create(newCampground)
    newCampground.save()
      .then(() => res.redirect('/campgrounds'))
      .catch((err) => console.log('Error while saving: ', err))
  });
});

//NEW - show form to create new campground
router.get('/new', middleware.isLoggedIn, (req, res) => {
  console.log('Env from campgrounds.js: ', process.env.GEOCODER_API_KEY);
  res.render('campgrounds/new');
});

// Show single campground
router.get('/:id', (req, res) => {
  const id = req.params.id;
  Campground.findById(id).populate('comments').exec() // populates the campground module with comments (one to many)
    .then((campground) => res.render('campgrounds/show', { campground }))
    .catch((err) => console.log('Error from findById: ', err))
});

// EDIT - shows edit form for a campground
router.get('/:id/edit', middleware.isLoggedIn, middleware.checkCampgroundOwnership, (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => {
      res.render('campgrounds/edit', { campground });
    })
    .catch((err) => {
      console.log('Error in showing the edit form: ', err);
      res.redirect('/campgrounds');
    })
});

// Update Campground
router.put('/:id', middleware.checkCampgroundOwnership, middleware.isSafe, (req, res) => {
  const { name, image, description, cost } = req.body;
  const id = req.params.id;

  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    };

    const lat = data[0].latitude;
    const lng = data[0].longitude;
    const location = data[0].formattedAddress;

    const newCampgroundData = {
      name,
      image,
      cost,
      description,
      location,
      lat,
      lng
    };

    Campground.findByIdAndUpdate(id, { $set: newCampgroundData })
      .then((campgroundUpdated) => {
        req.flash("success", "Successfully Updated!");
        res.redirect(`/campgrounds/${campgroundUpdated._id}`);
      })
      .catch((err) => {
        req.flash("error", err.message);
        res.redirect('/campgrounds');
      });
  });
});

// Delete
router.delete('/:id', middleware.checkCampgroundOwnership, middleware.isLoggedIn, (req, res) => {
  const id = req.params.id;
  Campground.findByIdAndRemove(id)
    .then(() => res.redirect('/campgrounds'))
    .catch(() => res.redirect('/campgrounds'))
});

module.exports = router;