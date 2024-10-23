const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; 
const myDB = require('./connection'); 

module.exports = function(passport) {
  
  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDB.findUserByUsername(username, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        if (user.password !== password) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
      });
    }
  ));

  // Serialize user into the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser((id, done) => {
    myDB.findUserById(id, (err, user) => {
      done(err, user);
    });
  });
};