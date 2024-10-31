'use strict';

require('dotenv').config();
const express = require('express');
const myDB = require('./connection'); // Assuming `connection.js` exports a function
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
  cookie: { secure: false } // Set to true in production with HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');
app.set('views', './views/pug');

// Database connection
myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');



  // Root route to render the 'index.pug' view
  app.route('/').get((req, res) => {
    res.render('index', { title: 'Connected to Database', message: 'Please log in' });
  });

}).catch(e => {
  console.error('Database connection failed:', e); // Log the error
  // Error route if the database connection fails
  app.route('/').get((req, res) => {
    res.render('index', { title: 'Database Error', message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});