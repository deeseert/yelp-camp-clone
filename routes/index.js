const express = require('express');
const router = express.Router();

const User = require('../models/user');
const passport = require('passport');


router.get('/', (req, res) => {
  res.render('landing');
});

// Show Register form
router.get('/register', (req, res) => {
  res.render('register', { page: 'register' });
});

//handle sign up logic
router.post('/register', (req, res) => {
  const newUser = new User({ username: req.body.username });
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }

  User.register(newUser, req.body.password, (err, user) => {

    if (err) {
      console.log(err);
      return res.render('register');
    }

    passport.authenticate('local')(req, res, () => {
      req.flash('success', `Successfully Signed Up! Nice to meet you ${req.body.username}`);
      res.redirect('/campgrounds');
    });

  });
});

// show login form
router.get('/login', (req, res) => {
  res.render('login', { page: 'login' });
});

// handling login logic
router.post('/login', passport.authenticate('local',
  {
    successRedirect: '/campgrounds',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: 'Welcome to YelpCamp!'
  }), (req, res) => {
  });

// logic route
router.get('/logout', (req, res) => {
  req.flash('success', 'Logged you out!');
  req.logout();
  res.redirect('/campgrounds');
});

module.exports = router;