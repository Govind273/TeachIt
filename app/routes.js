async = require("async");
var path = require('path'),
    fs = require('fs');

var User = require('../app/models/user');
var CourseCreated = require('../app/models/course_created');


module.exports = function(app, passport,server, mongoose, Grid, fs) {

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
				// console.log("In uploader...");
				var courses = [];
				var email = request.user.user.email;
				// console.log(email);
				User.findOne( { 'user.email' :  email }, function(err, user) {
					// console.log("Found yui...");
					courses = user.user.courses_created;
					// console.log(courses);
					response.render('uploader_dashboard.html',  {
						courses : courses
					});
				});
				// console.log(courses);
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
				response.render('create_course.html', { 
					user: "",
					currentCourseVideos: ""
				});
			} else {
				response.redirect('/viewer');
			}
		} else {
			response.redirect('/login');	
		}
	});	

	var Schema = mongoose.Schema;
	mongoose.createConnection('mongodb://localhost/teachItDB');
	var conn = mongoose.connection;
	Grid.mongo = mongoose.mongo;
	var DOWNLOAD_DIR = './public/videos/';
	var gfs;
	var video_name = "SampleVideo.mp4";

	conn.once('open', function() {
	    console.log('open');
	    gfs = Grid(conn.db);
		app.set('gridfs',gfs);
	});

	app.get('/viewcourse', function(request, response) {
		if(request.isAuthenticated()) {
			if(request.user.user.role == 'uploader') {
				response.redirect('/uploader');
			} else {
				var course_name = "Course Name";

				var fs_write_stream = fs.createWriteStream(DOWNLOAD_DIR+video_name);
				//read from mongodb
				var readstream;

				readstream = gfs.createReadStream({
					filename: video_name
				});

				readstream.pipe(fs_write_stream);
				fs_write_stream = fs.createWriteStream(DOWNLOAD_DIR+video_name);
				console.log(fs_write_stream);
				

				fs_write_stream.on('close', function () {
				fs_write_stream = fs.createWriteStream(DOWNLOAD_DIR +video_name);
			    console.log('file has been written fully!');
				});

				response.render('viewer_video.html', {
					user : request.user.user,
					video_name : "/videos/"+video_name
				});
			}
		} else {
			response.redirect('/login');	
		}
	})

	app.post('/addCourse', function(request, response){
		var email = request.user.user.email;
		console.log(email);
		var currentCourse = "";
		User.findOne({ 'user.email' : email  }, function(err, user) {
			var i =0;
			var courses = user.user.courses_created;
			for(i = 0; i<courses.length; i++){
				if(courses[i].course_name == currentCourse){
					courses[i].course_name = request.body.course_name;
					courses[i].course_desc = request.body.course_desc;
					courses[i].course_genre = request.body.course_genre;
					user.user.courses_created = courses;
					user.markModified('user');
                    user.save();
                    break;							
				}
			}
			if(i == courses.length){
				  var newCourse = new CourseCreated();
                  newCourse.course_name = request.body.course_name;
                  newCourse.course_desc = request.body.course_desc;
                  newCourse.course_genre = request.body.course_genre;
                  user.user.courses_created.push(newCourse);
                  user.save();
			}
			var currentCourseVideos = user.user.courses_created;
			response.render('uploader_dashboard.html', {
                  user : request.user.user,
                  courses : currentCourseVideos
                });
			response.redirect('/uploader');
		}
	)
	});

};