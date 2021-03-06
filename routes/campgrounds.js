const express = require('express');
const router = express.Router();
const NodeGeocoder = require('node-geocoder');
const multer = require('multer');
const cloudinary = require('cloudinary');

const Campground = require('../models/campground');
const Review = require("../models/review");
const { checkCampgroundOwnership, isLoggedIn, isPaid } = require('../middleware');
router.use(isLoggedIn, isPaid);

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
// Google Map
const geocoder = NodeGeocoder(options);

// ---- Upload images -----start
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter })

cloudinary.config({
  cloud_name: 'deeseert',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// ---- Upload images -----end



// Define escapeRegex function for search feature
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


//INDEX - show all campgrounds
router.get("/", function (req, res) {
  var noMatch = null;

  if (req.query.paid) res.locals.success = 'Payment succeeded, welcome to YelpCamp!';

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all campgrounds from DB
    Campground.find({ name: regex }, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        if (allCampgrounds.length < 1) {
          noMatch = "No campgrounds match that query, please try again.";
        }
        res.render("campgrounds/index", { campgrounds: allCampgrounds, noMatch: noMatch });
      }
    });
  } else {
    const perPage = 8;
    const pageQuery = parseInt(req.query.page);
    const pageNumber = pageQuery ? pageQuery : 1;
    // Get all campgrounds from DB
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
      Campground.count().exec(function (err, count) {

        if (err) {
          console.log(err);
        } else {
          res.render("campgrounds/index", {
            campgrounds: allCampgrounds,
            noMatch: noMatch,
            current: pageNumber,
            pages: Math.ceil(count / perPage)
          });
        }
      });
    });
  }
});

// // Get all Campgrounds
// router.get('/', (req, res) => {
//   Campground.find({})
//     .then((campgrounds) => {

//       if (req.query.search && req.xhr) {
//         const regex = new RegExp(escapeRegex(req.query.search), 'gi');
//         // Get all campgrounds from DB
//         Campground.find({ name: regex })
//           .then((allCampgrounds) => {
//             res.status(200).json(allCampgrounds);

//             if (req.xhr) {
//               res.json(allCampgrounds);
//             }

//           })
//           .catch((err) => console.log(err))
//       }

//       res.render('campgrounds/index', { campgrounds, page: 'campgrounds' })
//     })
//     .catch((err) => console.log('Error from fetching camps: ', err));
// });

// Create Campground
router.post('/', upload.single('image'), (req, res) => {
  const { name, description, cost } = req.body;
  let image = req.body.image;
  const author = {
    id: req.user._id,
    username: req.user.username
  };

  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }

    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
      // add cloudinary url for the image to the campground object under image property
      // Campground.create(newCampground)
      if (err) {
        console.log('Err: ', err);
      }

      const lat = data[0].latitude;
      const lng = data[0].longitude;
      const location = data[0].formattedAddress;

      const newCampground = new Campground({
        name,
        image: result.secure_url,
        imageId: result.public_id,
        description,
        cost,
        author,
        lat,
        lng,
        location
      });

      // eval(require('locus'));
      // newCampground.save()
      Campground.create(newCampground)
        .then(() => res.redirect('/campgrounds'))
        .catch((err) => console.log('Error while saving: ', err))
    });

  });

});

//NEW - show form to create new campground
router.get('/new', (req, res) => {
  res.render('campgrounds/new');
});

// Show single campground
router.get('/:slug', (req, res) => {
  const id = req.params.id;
  Campground.findOne({ slug: req.params.slug }).populate('comments likes').populate({
    path: "reviews",
    options: { sort: { createdAt: -1 } }
  }).exec() // populates the campground module with comments (one to many)
    .then((campground) => res.render('campgrounds/show', { campground }))
    .catch((err) => console.log('Error from findById: ', err))
});

// EDIT - shows edit form for a campground
router.get('/:slug/edit', checkCampgroundOwnership, (req, res) => {
  const id = req.params.id;
  Campground.findOne({ slug: req.params.slug })
    .then((campground) => {
      res.render('campgrounds/edit', { campground });
    })
    .catch((err) => {
      console.log('Error in showing the edit form: ', err);
      res.redirect('/campgrounds');
    })
});

// Update Campground
router.put('/:slug', upload.single('image'), checkCampgroundOwnership, (req, res) => {
  const { name, description, cost } = req.body;
  let image = req.body.image;
  const id = req.params.id;

  delete req.body.campground.rating;

  Campground.findOne({ slug: req.params.slug })
    .then((campground) => {

      geocoder.geocode(req.body.location, async (err, data) => {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        };

        const lat = data[0].latitude;
        const lng = data[0].longitude;
        const location = data[0].formattedAddress;

        if (req.file) {
          try {
            await cloudinary.v2.uploader.destroy(campground.imageId)
            const results = await cloudinary.v2.uploader.upload(req.file.path)
            campground.imageId = results.public_id;
            campground.image = results.secure_url;
          } catch (err) {
            req.flash("error", err.message);
            res.redirect('/campgrounds');
          }

        }

        campground.name = name;
        campground.cost = cost;
        campground.description = description;
        campground.location = location;
        campground.lat = lat;
        campground.lng = lng;

        console.log('before saving ', campground)
        campground.save()

        req.flash("success", "Successfully Updated!");
        res.redirect(`/campgrounds/${campground._id}`);
      })
        .catch((err) => {
          req.flash("error", err.message);
          res.redirect('/campgrounds');
        });
    })
});

// Delete
router.delete('/:slug', checkCampgroundOwnership, (req, res) => {
  const id = req.params.id;
  Campground.findOne({ slug: req.params.slug })
    .then((campground) => {

      cloudinary.v2.uploader.destroy(campground.imageId)
        .then(() => {
          Campground.remove();
          req.flash('success', 'Campground removed successfully!');
          res.redirect('/campgrounds');
        })

      Comment.remove({ "_id": { $in: campground.comments } })
        .then(() => {
          Review.remove({ "_id": { $in: campground.reviews } })
            .then(() => {
              campground.remove();
              req.flash("success", "Campground deleted successfully!");
              res.redirect("/campgrounds");
            })
        })
    })
    .catch((err) => {
      req.flash("error", err.message);
      res.redirect('/campgrounds');
    })
});

// Campground Like Route
router.post("/:id/like", function (req, res) {
  Campground.findById(req.params.id, function (err, foundCampground) {
    if (err) {
      console.log(err);
      return res.redirect("/campgrounds");
    }

    // check if req.user._id exists in foundCampground.likes
    var foundUserLike = foundCampground.likes.some(function (like) {
      return like.equals(req.user._id);
    });

    if (foundUserLike) {
      // user already liked, removing like
      foundCampground.likes.pull(req.user._id);
    } else {
      // adding the new user like
      foundCampground.likes.push(req.user);
    }

    foundCampground.save(function (err) {
      if (err) {
        console.log(err);
        return res.redirect("/campgrounds");
      }
      return res.redirect("/campgrounds");
    });
  });
});


module.exports = router;