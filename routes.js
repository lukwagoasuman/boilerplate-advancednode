'use strict';

const passport = require('passport');
const bcrypt = require('bcrypt');


module.exports = function (app, myDataBase) {

  // Helper function to check authentication
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  };

  // Home Route
  app.get('/', (req, res) => {
    res.render('index', { 
      title: 'Connected to Database', 
      message: 'Please log in', 
      showLogin: true, 
      showRegistration: true 
    });
  });

  // Register Route
  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          return next(err); // Handle database error
        } else if (user) {
          return res.redirect('/'); // User exists, redirect to home
        } else {
          const hashedPassword = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hashedPassword
          }, (err, doc) => {
            if (err) return next(err); // Handle insertion error
            next(null, doc.ops[0]);
          });
        }
      });
    },
    passport.authenticate('local', { failureRedirect: '/' }), // Authenticate after registration
    (req, res) => {
      res.redirect('/profile'); // Redirect to profile on success
    }
  );

  // Login Route
  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    console.log(`User ${req.body.username} attempted to log in.`);
    res.redirect('/profile');
  });

  // Profile Route
  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
  });

  // Logout Route
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  // 404 Error Route
  app.use((req, res) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
};
