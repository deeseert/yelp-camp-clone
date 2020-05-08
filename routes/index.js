const express = require('express');
const router = express.Router();

const User = require('../models/user');
const passport = require('passport');

//  Middleware checks if logged in
// const isLoggedIn = (req, res, next) => {
//   if (req.isAuthenticated()) return next();

//   res.redirect('/login');
// };

router.get('/', (req, res) => {
  res.render('landing');
});

router.get('/register', (req, res) => {
  res.render('register');
});

//handle sign up logic
router.post('/register', (req, res) => {
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
router.get('/login', (req, res) => {
  res.render('login');
});

// handling login logic
router.post('/login', passport.authenticate('local',
  {
    successRedirect: '/campgrounds',
    failureRedirect: '/login'
  }), (req, res) => {
  });

// logic route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/campgrounds');
});

module.exports = router;