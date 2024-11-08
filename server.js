'use strict';

require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');

const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local').Strategy;
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const routes = require('./routes.js');
const auth = require('./auth.js');

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

// FCC Testing
fccTesting(app);

// Database Connection and Routes
myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  auth(app, myDataBase);
  routes(app, myDataBase);

 
// Server Setup
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
 
 });


});
