'use strict';

require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

// FCC testing purposes
fccTesting(app);

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

// Configure Local Strategy for Passport
passport.use(new LocalStrategy(
  (username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect username' });
      if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password' });
      return done(null, user);
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  myDataBase.findOne({ _id: id }, (err, user) => {
    if (err) return done(err);
    done(null, user);
  });
});

app.set('view engine', 'pug');
app.set('views', './views/pug');

// Database connection
myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render('index', { title: 'Connected to Database', message: 'Please log in', showLogin: true });
  });

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      console.log(`User ${req.body.username} attempted to log in.`);
      res.redirect('/profile');
    });

  function ensureAuthenticated(req, res, next) {  //This is Application Security DAY 33 
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile');
  });

}).catch(e => {
  console.error('Database connection failed:', e);
  app.route('/').get((req, res) => {
    res.render('index', { title: 'Database Error', message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});