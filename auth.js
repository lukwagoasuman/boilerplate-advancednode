'use strict';

const passport = require('passport');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local').Strategy;

const fccTesting = require('./freeCodeCamp/fcctesting.js');


module.exports = function (app, myDataBase) {
  // Configure Passport Local Strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await myDataBase.findOne({ username });
      if (!user) return done(null, false, { message: 'Incorrect username' });
      if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await myDataBase.findOne({ _id: id });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
};
