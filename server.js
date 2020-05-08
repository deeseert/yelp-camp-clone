const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

mongoose.connect('mongodb://localhost:27017/yelp_camp_v3',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const Campground = require('./models/campground');
const Comment = require('./models/comment');
const User = require('./models/user');
const seedDB = require('./seeds.js');
seedDB();


app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// app.use(__dirname + '/public');
app.use(express.static(__dirname + '/public'));

// Passport Config
app.use(require('express-session')({
  secret: 'gio testing',
  resave: false,
  saveUninitialized: false
}));

// Use Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// app.use(__dirname + '/public');
app.use(express.static(__dirname + '/public'));

//  Middleware checks if logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  res.redirect('/login');
};

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

app.get('/campgrounds/:id/comments/new', isLoggedIn, (req, res) => {
  const id = req.params.id;
  Campground.findById(id)
    .then((campground) => res.render('comments/new', { campground }))
});

app.post('/campgrounds/:id/comments', isLoggedIn, (req, res) => {
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


// ========================================
// AUTH ROUTES
// ========================================
app.get('/register', (req, res) => {
  res.render('register');
});

//handle sign up logic
app.post('/register', (req, res) => {
  const newUser = new User({ username: req.body.username });

  User.register(newUser, req.body.password, (err, user) => {

    if (err) {
      console.log(err);
      return res.render('register');
    }

    passport.authenticate('local')(req, res, () => {
      res.redirect('/campgrounds');
    });

  });
});

// show login form
app.get('/login', (req, res) => {
  res.render('login');
});

// handling login logic
app.post('/login', passport.authenticate('local',
  {
    successRedirect: '/campgrounds',
    failureRedirect: '/login'
  }), (req, res) => {
  });

// logic route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/campgrounds');
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});