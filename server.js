const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/yelp_camp_v3',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const Campground = require('./models/campground');
const Comment = require('./models/comment');
const seedDB = require('./seeds.js');
seedDB();


app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// app.use(__dirname + '/public');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/campgrounds', (req, res) => {
  Campground.find({})
    .then((campgrounds) => res.render('campgrounds/index', { campgrounds }))
    .catch((err) => console.log('Error from fetching camps: ', err));
});

app.post('/campgrounds', (req, res) => {
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

app.get('/campgrounds/new', (req, res) => {
  res.render('campgrounds/new');
});

// Show route
app.get('/campgrounds/:id', (req, res) => {
  const id = req.params.id;
  Campground.findById(id).populate('comments').exec() // populates the campground module with comments (one to many)
    .then((foundCampground) => {
      console.log('Campground found: ', foundCampground)
      return foundCampground
    })
    .then((foundCampground) => res.render('campgrounds/show', { foundCampground }))
    .catch((err) => console.log('Error from findById: ', err))
});

// ========================================
// COMMENT ROUTES
// ========================================

app.get('/campgrounds/:id/comments/new', (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => res.render('comments/new', { campground }))
});

app.post('/campgrounds/:id/comments', (req, res) => {
  const id = req.params.id;
  const campground = Campground.findById(id)
  const comment = Comment.create(req.body.comment)

  Promise.all([campground, comment])
    .then(([campground, comment]) => {
      campground.comments.push(comment);
      campground.save()
        .then(() => res.redirect(`/campgrounds/${campground._id}`));
    })
    .catch((err) => console.log('Error while processing the comment: ', err))
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});