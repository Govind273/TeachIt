async = require("async");
var path = require('path'),
    fs = require('fs');

var User = require('../app/models/user');


module.exports = function(app, passport,server) {
	app.get('/', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.redirect('/uploader');
			} else {
				response.redirect('/viewer');
			}
		}
		response.render('index.html');
	});

	app.get('/login', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.redirect('/uploader');
			} else {
				response.redirect('/viewer');
			}
		} else {
			response.render('login.html', { message: request.flash('error') });	
		}
	});

	app.get('/viewer', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.redirect('/uploader');
			} else {
				response.render('viewer.html', { message: request.flash('error') });
			}
		} else {
			response.redirect('/login');	
		}
	});

	app.get('/uploader', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.render('uploader_dashboard.html', { message: request.flash('error') });
			} else {
				response.redirect('/viewer');
			}
		} else {
			response.redirect('/login');	
		}
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
					res.redirect('/viewer');
				}
			});
		}
	);

	app.post('/register', passport.authenticate('register', {
		successRedirect : '/viewer',
		failureRedirect : '/login', 
		failureFlash : true 
	}));

	app.get('/logout', function(request, response) {
		request.logout();
		response.redirect('/');
	});

	app.get('/createcourse', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.render('create_course.html', { message: request.flash('error') });
			} else {
				response.redirect('/viewer');
			}
		} else {
			response.redirect('/login');	
		}
	});	
};