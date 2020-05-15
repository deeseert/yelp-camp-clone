// require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const moment = require('moment');
const dotenv = require('dotenv');
// configure dotenv
// require('dotenv').load();
dotenv.config();
console.log('Env from server.js: ', process.env.GEOCODER_API_KEY);

const campgrounds = require('./routes/campgrounds');
const index = require('./routes/index');
const comments = require('./routes/comments');

const User = require('./models/user');
const seedDB = require('./seeds.js');

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/yelp_camp_v3',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log(`Database connected`))
  .catch(err => console.log(`Database connection error: ${err.message}`));

// seedDB();

// app.use(bodyParser.urlencoded({ extended: true })); // Old syntax
// app.use(bodyParser.json()); // Old syntax
app.use(express.json()); // New syntax
app.use(express.urlencoded({ extended: true })); // New syntax
app.set('view engine', 'ejs');
// app.use(__dirname + '/public');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
app.locals.moment = moment; // Moment
//  Use Flash for notifications
app.use(flash());

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

// Middleware to pass a variable to all the templates
// app.use calls the function/code on every single route!
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');

  next();
});

// Require and use routes
app.use('/campgrounds', campgrounds);
app.use('/', index);
app.use('/campgrounds/:id/comments', comments);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});