'use strict';

require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local').Strategy;
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

// Set view engine and views directory
app.set('view engine', 'pug');
app.set('views', './views/pug');

// Middleware
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// FCC Testing
fccTesting(app);

// Database Connection and Routes
myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  // Helper function to check authentication
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  };

  // Passport Configuration
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await myDataBase.findOne({ username });
        if (!user) return done(null, false, { message: 'Incorrect username' });
        if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await myDataBase.findOne({ _id: id });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Routes
  app.get('/', (req, res) => {
    res.render('index', { title: 'Connected to Database', message: 'Please log in', showLogin: true, showRegistration: true });
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
            if (err) {
              return next(err); // Handle insertion error
            }
            // Proceed to authenticate the newly registered user
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
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  // 404 Error Route
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

}).catch(e => {
  console.error('Database connection failed:', e);
  app.get('/', (req, res) => {
    res.render('index', { title: 'Database Error', message: 'Unable to connect to database' });
  });
});

// Server Setup
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
