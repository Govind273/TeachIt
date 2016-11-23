async = require("async");
var path = require('path'),
    fs = require('fs');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;
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
				var courses = [];
				User.find({ 'user.role' : 'uploader'}, function(err,user){

					response.render('viewer.html', {
						all_users : user
					});
				});
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

	app.get('/updateprofile', function(request, response){
		if(request.isAuthenticated()){
			if(request.user.user.role == 'uploader'){
				response.render('uploader_profile.html', {
					user_details : request.user.user
				})
			}
			else{
				response.render('viewer_profile.html', {
					user_details : request.user.user
				})
			}
		}
		else{
			response.redirect('/login');
		}
	})


	var Schema = mongoose.Schema;
	mongoose.createConnection('mongodb://localhost/teachItDB');
	var conn = mongoose.connection;
	Grid.mongo = mongoose.mongo;
	var DOWNLOAD_DIR = './public/videos/';
	var gfs;
	var video_name;

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
				var course_name = "test";

				User.findOne({'user.courses_created.course_name' : course_name}, function(err, user) {
					// console.log(user);
					var user = user.user;
					var all_courses = user.courses_created;

					for(var i=0; i<all_courses.length; i++) {
						if(all_courses[i].course_name == course_name) {
							var video = all_courses[i].videos[0];
							video_name = video.video_filename;
							var vttfile = video.video_thumbnail_vttfile;
							var screenshots = video.video_screenshots;
							var markervttfile = video.video_marker_vttfile;
							var video_quiz_qn = video.video_quiz_qn;
							var video_quiz_ans = video.video_quiz_ans;

							var fs_write_stream = fs.createWriteStream(DOWNLOAD_DIR+video_name);
							//read from mongodb
							var readstream = gfs.createReadStream({
								filename: video_name
							});

							readstream.pipe(fs_write_stream);
							
							readstream.on('end', function () {
							    console.log('file has been written fully!');

							    var fs_write_stream2 = fs.createWriteStream('./public/videos/'+vttfile);
								var readstream2 = gfs.createReadStream({
									filename: vttfile
								});

								readstream2.pipe(fs_write_stream2);
						
								readstream2.on('end', function() {
									for(var j=0; j<screenshots.length-1; j++) {
										var fs_write_stream3 = fs.createWriteStream('./public/videos/screenshots/'+screenshots[j]);
										//read from mongodb
										var readstream3 = gfs.createReadStream({
											filename: video_name+"-"+screenshots[j]
										});

										readstream3.pipe(fs_write_stream3);
										
										readstream3.on('end', function() {
											var fs_write_stream4 = fs.createWriteStream('./public/videos/'+markervttfile);
											var readstream4 = gfs.createReadStream({
												filename: markervttfile
											});

											readstream4.pipe(fs_write_stream4);

										})
									}			
									console.log("Files generated!!!");
								})
							});

							response.render('viewer_video.html', {
								user : request.user.user,
								video_name : "/videos/"+video_name,
								video_thumbnail_vttfile : '/videos/'+vttfile,
								video_marker_vttfile : '/videos/'+markervttfile,
								video_quiz_qn : video_quiz_qn,
								video_quiz_ans : video_quiz_ans
							});

						}
					}
				});

			}
		} else {
			response.redirect('/login');	
		}
	})



	app.post('/addCourse', function(request, response){
		var email = request.user.user.email;
		var currentCourse = "";
		if(null != request.body.course_name) {
			currentCourse = request.body.course_name;
		}
		 
		User.findOne({ 'user.email' : email  }, function(err, user) {
			var i =0;
			var courses = user.user.courses_created;
			for(i = 0; i<courses.length; i++){
				if(courses[i].course_name == currentCourse){
					courses[i].course_name = request.body.course_name;
					courses[i].course_description = request.body.course_description;
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
                  newCourse.course_description = request.body.course_description;
                  newCourse.course_genre = request.body.course_genre;
                  user.user.courses_created.push(newCourse);
                  user.save();
			}
			var currentCourseVideos = user.user.courses_created;
			response.render('uploader_dashboard.html', {
                  user : request.user.user,
                  courses : currentCourseVideos
                });
			//response.redirect('/uploader');
		}
	)
	});

	app.post('/editcourse', function(request, response) {
		//console.log(request.body);
		var current_course_name  = Object.keys(request.body);
		var email = request.user.user.email;
		User.findOne({ 'user.email' : email }, function(err, user) {
			var i = 0;
			var courses = user.user.courses_created;
			var current_course_data = {};
			for(i =0; i<courses.length; i++) {
				if(courses[i].course_name == current_course_name[0]) {
					current_course_data = courses[i];
					break;
				}
			}
			//console.log(current_course_data);

			response.render('edit_course.html', {
				course_details: current_course_data
			});
		});

	});

	app.post('/updateProfile', function(request, response) {
		var email = request.user.user.email;
		User.findOne({ 'user.email' : email}, function(err, user){
			user.user.firstname = request.body.firstname;
			user.user.lastname = request.body.lastname;
			
			user.markModified('user');
			user.save();

			if(user.user.role == 'uploader') {
				response.render('uploader_profile.html', {
				user_details : user.user
				});	
			} else {
				response.render('viewer_profile.html', {
				user_details : user.user
				});
			}
			
		})
	})


	app.post('/enrollcourse', function(request, response) {
		var email = request.user.user.email;
		var course_name = Object.keys(request.body)[0];
		
		User.findOne({'user.email' : email}, function(err, user) {
			var courses_enrolled = user.user.courses_enrolled;
			
			if(courses_enrolled.indexOf(course_name) > -1) {
				User.findOne({ 'user.courses_created.course_name' : course_name}, function(err, user){
				console.log("Found uploader!!");
				var user= user.user;
				var courses = user.courses_created;
				var course_videos = [];
				var course = [];
				for(var i=0; i<courses.length; i++) {
					if(courses[i].course_name == course_name) {
						course = courses[i];
						course_videos = course.videos;
					}
				}
				var comments = course_videos[0].video_comments;

				for(var i=0; i<course_videos.length; i++) {
					var fs_write_stream2 = fs.createWriteStream('./public/videos/'+course_videos[i].video_filename);
					var readstream2 = gfs.createReadStream({
						filename: course_videos[i].video_filename
					});
					readstream2.pipe(fs_write_stream2);
				}

				response.render('viewer_enrolled_course.html', {
					coursename : course_name,
					course : course,
					videos : course_videos,
					viewername : request.user.user.firstname,
					comments : comments
				})
			});
			} else {
				User.findOne({ 'user.courses_created.course_name' : Object.keys(request.body)[0]}, function(err, user){
					var user = user.user;
					var author = user.firstname + user.lastname;
					
					var coursename;
					var coursedescription;
					var video;
					var video_name, vttfile, markervttfile, video_quiz_qn, video_quiz_ans;
					var screenshots;

					for(var i=0; i<user.courses_created.length; i++){
						if(user.courses_created[i].course_name == Object.keys(request.body)[0]){
							coursename = user.courses_created[i].course_name;
							
							coursedescription = user.courses_created[i].course_description;
								video = user.courses_created[i].videos[0];
								video_name = video.video_filename;
								vttfile = video.video_thumbnail_vttfile;
								markervttfile = video.video_marker_vttfile;
								video_quiz_qn = video.video_quiz_qn;
								video_quiz_ans = video.video_quiz_ans;
								screenshots = video.video_screenshots;

								
									var fs_write_stream = fs.createWriteStream(DOWNLOAD_DIR+video_name);
									//read from mongodb
									var readstream = gfs.createReadStream({
										filename: video_name
									});

									readstream.pipe(fs_write_stream);
									
									readstream.on('end', function () {
									    console.log('file has been written fully!');

									    var fs_write_stream2 = fs.createWriteStream('./public/videos/'+vttfile);
										var readstream2 = gfs.createReadStream({
											filename: vttfile
										});

										readstream2.pipe(fs_write_stream2);
								
										readstream2.on('end', function() {
											for(var j=0; j<screenshots.length-1; j++) {
												var fs_write_stream3 = fs.createWriteStream('./public/videos/screenshots/'+screenshots[j]);
												//read from mongodb
												var readstream3 = gfs.createReadStream({
													filename: video_name+"-"+screenshots[j]
												});

												readstream3.pipe(fs_write_stream3);
												
												readstream3.on('end', function() {
													var fs_write_stream4 = fs.createWriteStream('./public/videos/'+markervttfile);
													var readstream4 = gfs.createReadStream({
														filename: markervttfile
													});

													readstream4.pipe(fs_write_stream4);

												})
											}			
											console.log("Files generated!!!");
										})
									});

								
								
						}
						break;
					}

					
					response.render('viewer_enroll_course.html', {
						course : Object.keys(request.body),
						author : author,
						coursename : coursename,
						coursedescription : coursedescription,
						video_name : "/videos/"+video_name,
						video_thumbnail_vttfile : '/videos/'+vttfile,
						video_marker_vttfile : '/videos/'+markervttfile,
						video_quiz_qn : video_quiz_qn,
						video_quiz_ans : video_quiz_ans
					})
				})
			}
		});

	});

	app.get('/forgot', function(req, res) {
	  res.render('forgot_password.html', {
	    user: req.user
	  });
	});

	app.post('/forgot', function(req, res, next) {
	  async.waterfall([
	    function(done) {
	      crypto.randomBytes(20, function(err, buf) {
	        var token = buf.toString('hex');
	        done(err, token);
	      });
	    },
	    function(token, done) {
	    	// console.log(req.body);
	      User.findOne({ 'user.email': req.body.email }, function(err, user) {
	        if (!user) {
	          req.flash('error', 'No account with that email address exists.');
	          return res.redirect('/forgot');
	        }
	        console.log("Found user!!");
	        user.user.resetPasswordToken = token;
	        user.user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
	        user.markModified('user');
	        user.save(function(err) {
	          done(err, token, user);
	        });
	      });
	    },
	    function(token, user, done) {
	    	console.log("Sending email to..."+user.user.email);
	      var smtpTransport = nodemailer.createTransport('smtps://testing.teachit%40gmail.com:teaching@smtp.gmail.com');

	      var mailOptions = {
	        to: user.user.email,
	        from: 'passwordreset@demo.com',
	        subject: 'Node.js Password Reset',
	        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
	          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
	          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
	          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	      	console.log("Email has been sent");
	        req.flash('info', 'An e-mail has been sent to ' + user.user.email + ' with further instructions.');
	        done(err, 'done');
	      });
	    }
	  ], function(err) {
	    if (err) return next(err);
	    res.redirect('/forgot');
	  });
	});

	app.get('/reset/:token', function(req, res) {
	  User.findOne({ 'user.resetPasswordToken' : req.params.token, 'user.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
	    if (!user) {
	      req.flash('error', 'Password reset token is invalid or has expired.');
	      return res.redirect('/forgot');
	    }
	    // console.log(user.user);
	    res.render('reset_password.html', {
	      user: user.user
	    });
	  });
	});

	app.post('/reset/:token', function(req, res) {
		// console.log("In reset post...");
		// console.log(req.body);
	  async.waterfall([
	    function(done) {
	      User.findOne({ 'user.resetPasswordToken': req.body.resetPasswordToken, 'user.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
	        if (!user) {
	          req.flash('error', 'Password reset token is invalid or has expired.');
	          return res.redirect('back');
	        }

	        user.user.password = user.generateHash(req.body.password);
	        user.user.resetPasswordToken = undefined;
	        user.user.resetPasswordExpires = undefined;
	        user.markModified('user');
	        user.save(function(err) {
	          req.logIn(user, function(err) {
	            done(err, user);
	          });
	        });
	      });
	    },
	    function(user, done) {
	      var smtpTransport = nodemailer.createTransport('smtps://testing.teachit%40gmail.com:teaching@smtp.gmail.com');

	      var mailOptions = {
	        to: user.user.email,
	        from: 'passwordreset@demo.com',
	        subject: 'Your password has been changed',
	        text: 'Hello,\n\n' +
	          'This is a confirmation that the password for your account ' + user.user.email + ' has just been changed.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	      	console.log("Password changed!!!!");
	        req.flash('success', 'Success! Your password has been changed.');
	        done(err);
	      });
	    }
	  ], function(err) {
	    res.redirect('/');
	  });
	});


	app.post('/enrolled', function(req,res) {
		User.findOne({ 'user.email' :  req.user.user.email }, function(err, user) {
			// console.log(user);
			user.user.courses_enrolled.push(req.body.course_name);
			user.markModified('user');
			user.save();

			User.findOne({ 'user.courses_created.course_name' : req.body.course_name}, function(err, user){
				console.log(user);
				var user= user.user;
				var courses = user.courses_created;
				var course_videos = [];
				var course = [];
				for(var i=0; i<courses.length; i++) {
					if(courses[i].course_name == req.body.course_name) {
						course = courses[i];
						course_videos = course.videos;
					}
				}
				var comments = course_videos[0].video_comments;

				for(var i=0; i<course_videos.length; i++) {
					var fs_write_stream2 = fs.createWriteStream('./public/videos/'+course_videos[i].video_filename);
					var readstream2 = gfs.createReadStream({
						filename: course_videos[i].video_filename
					});
					readstream2.pipe(fs_write_stream2);
				}


				res.render('viewer_enrolled_course.html', {
					coursename : req.body.course_name,
					course : course,
					videos : course_videos,
					viewername : req.user.user.firstname,
					comments : comments
				})
			});

		} )
	});


	app.post('/addlike', function(req, res){
		console.log(req.body);
		User.findOne({'user.courses_created.course_name' : req.body.coursename }, function(err, user){
			var user = user.user;
			var courses = user.courses_created;
			var course_videos = [];
			var course = [];
			
			for(var i=0; i<courses.length; i++) {
				if(courses[i].course_name == req.body.coursename) {
					course = courses[i];
					course_videos = course.videos;
					for(var j=0; j<course_videos.length; j++){
						if(course_videos[j].video_filename == req.body.video_filename){
							console.log(req.body.video_filename);
							var likes = {};
							likes.viewername = req.body.viewername;

							if(null != course_videos[j].video_dislikes) {
								var index = -1;
								for(var k=0; k<course_videos[j].video_dislikes.length; k++) {
									if(course_videos[j].video_dislikes[k].viewername == likes.viewername) {
										index = k;
										break;
									}
								}
								if( index > -1) {
									course_videos[j].video_dislikes.splice(index, 1);
								}
							}


							if(null == course_videos[j].video_likes){
								course_videos[j].video_likes = [];
							}

							var index2 = -1;
							for(var m=0; m<course_videos[j].video_likes.length;m++) {
								if(course_videos[j].video_likes[m].viewername == likes.viewername) {
									index2 = m;
									break;
								}
							}
							if(index2 == -1) {
								course_videos[j].video_likes.push(likes);
								break;
							}
						}
					}
					break;
				}
			}
			user.markModified('user');
			user.save();

		})
		res.end();
	});

	app.post('/adddislike', function(req, res){
		console.log(req.body);
		User.findOne({'user.courses_created.course_name' : req.body.coursename }, function(err, user){
			var user = user.user;
			var courses = user.courses_created;
			var course_videos = [];
			var course = [];
			
			for(var i=0; i<courses.length; i++) {
				if(courses[i].course_name == req.body.coursename) {
					course = courses[i];
					course_videos = course.videos;
					for(var j=0; j<course_videos.length; j++){
						if(course_videos[j].video_filename == req.body.video_filename){
							console.log(req.body.video_filename);
							var dislikes = {};
							dislikes.viewername = req.body.viewername;
							if(null != course_videos[j].video_likes) {
								var index = -1;
								for(var k=0; k<course_videos[j].video_likes.length; k++) {
									if(course_videos[j].video_likes[k].viewername == dislikes.viewername) {
										index = k;
										break;
									}
								}
								if( index > -1) {
									course_videos[j].video_likes.splice(index, 1);
								}
							}
							if(null == course_videos[j].video_dislikes){
								course_videos[j].video_dislikes = [];
							}

							var index2 = -1;
							for(var m=0; m<course_videos[j].video_dislikes.length;m++) {
								if(course_videos[j].video_dislikes[m].viewername == dislikes.viewername) {
									index2 = m;
									break;
								}
							}
							if(index2 == -1) {
								course_videos[j].video_dislikes.push(dislikes);
							} 
							break;
						}
					}
					break;
				}
			}
			user.markModified('user');
			user.save();

		})
		res.end();
	});

	app.post('/addcomment', function(req, res){
		User.findOne({'user.courses_created.course_name' : req.body.coursename }, function(err, user){
			var user = user.user;
			var courses = user.courses_created;
			var course_videos = [];
			var course = [];
			var comments = [];
			for(var i=0; i<courses.length; i++) {
				if(courses[i].course_name == req.body.coursename) {
					course = courses[i];
					course_videos = course.videos;
					for(var j=0; j<course_videos.length; j++){
						if(course_videos[j].video_filename == req.body.video_filename){
							console.log(req.body.video_filename);
							console.log(req.body.comment);
							var newcomment = {};
							newcomment.viewername = req.body.viewername;
							newcomment.comment = req.body.comment;
							if(null == course_videos[j].video_comments){
								course_videos[j].video_comments = [];
							}
							course_videos[j].video_comments.push(newcomment);
							comment = newcomment;
							break;
						}
					}
					break;
				}
			}
			user.markModified('user');
			user.save();

			res.json({
			comment : comment,
			videos : course_videos
			});

		})

	});


};