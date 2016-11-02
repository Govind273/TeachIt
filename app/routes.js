async = require("async");
var path = require('path'),
    fs = require('fs');


module.exports = function(app, passport,server) {
	app.get('/', function(request, response) {
		response.render('index.html');
	});

	app.get('/login', function(request, response) {
		response.render('login.html', { message: request.flash('error') });
	});

	app.get('/homepage', function(request, response) {
		response.render('homepage.html', { message: request.flash('error') });
	});

	app.post('/login', passport.authenticate('login', {
		successRedirect : '/homepage', 
		failureRedirect : '/login', 
		failureFlash : true
	}));

	app.post('/signup', passport.authenticate('signup', {
		successRedirect : '/login',
		failureRedirect : '/login', 
		failureFlash : true 
	}));
};