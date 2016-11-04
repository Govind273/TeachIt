async = require("async");
var path = require('path'),
    fs = require('fs');

var User = require('../app/models/user');


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

	app.get('/uploader', function(request, response) {
		response.render('uploader_dashboard.html', { message: request.flash('error') });
	});

	app.post('/login', passport.authenticate('login', {
		failureRedirect : '/login', 
		failureFlash : true
	}), function(req,res) {
			// console.log(req);
			User.findOne({'user.email': req.body.email}, function(err, user) {
			    if(user.user.role === "uploader") {
					res.redirect('/uploader');
				} else {
					res.redirect('/homepage');
				}
			});
		}
	);

	app.post('/register', passport.authenticate('register', {
		successRedirect : '/homepage',
		failureRedirect : '/login', 
		failureFlash : true 
	}));

	app.get('/logout', function(request, response) {
		request.logout();
		response.redirect('/');
	});

	app.get('/createcourse', function(request, response) {
		response.render('create_course.html', { message: request.flash('error') });
	});
	
};