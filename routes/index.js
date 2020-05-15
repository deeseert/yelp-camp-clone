const express = require('express');
const router = express.Router();
const passport = require('passport');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const stripeFactory = require('stripe');

const User = require('../models/user');
const Campground = require('../models/campground');
const { isLoggedIn, isPaid } = require('../middleware');
router.use(isLoggedIn);

const stripe = stripeFactory(process.env.STRIPE_SECRET_KEY);


router.get('/', (req, res) => {
  res.render('landing');
});

// Show Register form
router.get('/register', (req, res) => {
  res.render('register', { page: 'register' });
});

//handle sign up logic
router.post('/register', (req, res) => {
  const { username, password, avatar, firstName, lastName, email, adminCode } = req.body;
  const newUser = new User({ username, avatar, firstName, lastName, email });

  if (adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }

  User.register(newUser, password)
    .then(() => {
      passport.authenticate('local')(req, res, () => {
        req.flash('success', `Successfully Signed Up! Nice to meet you ${username}`);
        res.redirect('/campgrounds');
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect('/checkout');
    })
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

// USER PROFILE
router.get('/users/:id', function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err) {
      req.flash('error', 'Something went wrong.');
      return res.redirect('/');
    }
    if (foundUser) {
      Campground.find().where('author.id').equals(foundUser._id).exec(function (err, campgrounds) {
        if (err) {
          req.flash('error', 'Something went wrong.');
          return res.redirect('/');
        }
        res.render('users/show', { user: foundUser, campgrounds: campgrounds });
      })
    } else {
      req.flash('error', 'User not found.');
      res.redirect('back');
    }
  });
});

// Show Reset Pass Form
router.get('/forgot', (req, res) => {
  res.render('forgot');
});

// Handle Forgot Password
router.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {

      var smtpTransport = nodemailer.createTransport({
        host: 'smtp.zoho.eu',
        port: 465,
        secure: true,
        auth: {
          user: 'gioacchino.dinardo@zohomail.eu',
          pass: process.env.ZOHOPWD
        }
      });

      var mailOptions = {
        to: user.email,
        from: 'gioacchino.dinardo@zohomail.eu',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// Show page to reset password
router.get('/reset/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', { token: req.params.token });
  });
});

// Handle Reset Password
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        host: 'smtp.zoho.eu',
        port: 465,
        secure: true,
        auth: {
          user: 'gioacchino.dinardo@zohomail.eu',
          pass: process.env.ZOHOPWD
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'gioacchino.dinardo@zohomail.eu',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/campgrounds');
  });
});

// GET checkout
router.get('/checkout', isLoggedIn, (req, res) => {
  if (req.user && req.user.isPaid) {
    req.flash('success', 'Your account is already paid');
    return res.redirect('/campgrounds');
  }
  res.render('checkout', { amount: 20 });
});

// POST pay
router.post('/pay', isLoggedIn, async (req, res) => {
  const { paymentMethodId, items, currency } = req.body;
  // eval(require('locus'))
  // console.log(req.body)

  const amount = 2000;

  try {
    // Create new PaymentIntent with a PaymentMethod ID from the client.
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'gbp',
      payment_method: paymentMethodId,
      error_on_requires_action: true,
      confirm: true
    });

    console.log("💰 Payment received!");

    req.user.isPaid = true;
    await req.user.save();
    // The payment is complete and the money has been moved
    // You can add any post-payment code here (e.g. shipping, fulfillment, etc)

    // Send the client secret to the client to use in the demo
    res.send({ clientSecret: intent.client_secret });
  } catch (e) {
    // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
    // See https://stripe.com/docs/declines/codes for more
    if (e.code === "authentication_required") {
      res.send({
        error:
          "This card requires authentication in order to proceeded. Please use a different card."
      });
    } else {
      res.send({ error: e.message });
    }
  }
});




module.exports = router;
