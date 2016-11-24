// local authentication
var LocalStrategy    = require('passport-local').Strategy;

var User = require('../app/models/user');

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // deserialized when subsequent requests are made
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('login', new LocalStrategy({
        usernameField : 'email',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
       process.nextTick(function() {
            User.findOne({ 'user.email' :  email }, function(err, user) {
                if (err){ return done(err);}
                if (!user)
                    return done(null, false, req.flash('error', 'User does not exist.'));

                if (!user.verifyPassword(password))
                    return done(null, false, req.flash('error', 'Enter correct password'));
               else
                    return done(null, user);
            });
        });

    }));

    passport.use('register', new LocalStrategy({
        usernameField : 'email',
        passReqToCallback : true 
    },
    function(req, email, password, done) {

        process.nextTick(function() {
       
            if (!req.user) {
                User.findOne({ 'user.email' :  email }, function(err, user) {
            	    if (err){ return done(err);}
                    if (user) {
                        return done(null, false, req.flash('registererror', 'User already exists'));
                    } else {
                    	console.log(req);
                        var newUser            = new User();
						newUser.user.firstname  = req.body.firstname;
						newUser.user.lastname  = req.body.lastname;
                        newUser.user.email     = email;
                        newUser.user.password  = newUser.generateHash(password);
						newUser.user.role	   = req.body.role;
						
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }

                });
            }

        });
    }));

    passport.use('adminregister', new LocalStrategy({
        usernameField : 'email',
        passReqToCallback : true 
    },
    function(req, email, password, done) {

        process.nextTick(function() {
       
            if (!req.user) {
                User.findOne({ 'user.email' :  email }, function(err, user) {
                    if (err){ return done(err);}
                    if (user) {
                        return done(null, false, req.flash('registererror', 'Admin already exists'));
                    } else {
                        console.log(req);
                        var newUser            = new User();
                        newUser.user.firstname  = req.body.firstname;
                        newUser.user.lastname  = req.body.lastname;
                        newUser.user.email     = email;
                        newUser.user.password  = newUser.generateHash(password);
                        newUser.user.role      = "admin";
                        
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }

                });
            }

        });
    }));

    passport.use(new LocalStrategy(function(username, password, done) {
      User.findOne({ username: username }, function(err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        user.comparePassword(password, function(err, isMatch) {
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect password.' });
          }
        });
      });
    }));

};