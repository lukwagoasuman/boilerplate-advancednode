'use strict';

require('dotenv').config();
const express = require('express');
const myDB = require('./connection'); // Assuming myDB is properly defined in the connection module
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const configurepassport = require('./passport-config');
const passport = require('passport');
const session = require('express-session');
const { ObjectId } = require('mongodb');

const app = express();

fccTesting(app); // For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configurepassport(passport);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUnitialized: true,
  cookie: { secure: false }

}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  myDataBase.findOne({ _id: new ObjectId(id) }, (err, doc) => {
    done(null, null);
  });
});

// Set view engine and views directory
app.set('view engine', 'pug');
app.set('views', './views/pug');

// Route to render the 'index.pug' view on the root path
app.route('/').get((req, res) => {
  res.render('index', { title: 'hello', message: 'please log in'}); // Ensure you have 'index.pug' in your views directory
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});