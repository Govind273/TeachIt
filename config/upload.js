var User = require('../app/models/user');
var CourseCreated = require('../app/models/course_created');
var Video = require('../app/models/video');

module.exports = function(app, server, multer, mongoose, Grid, fs) {

  var Schema = mongoose.Schema;
  mongoose.createConnection('mongodb://localhost/teachItDB');
  var conn = mongoose.connection;
  Grid.mongo = mongoose.mongo;

  var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './uploads');
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now());
    }
  });
  var upload = multer({ storage : storage}).single('userPhoto');

  var gfs;

  conn.once('open', function() {
    console.log('open');
    gfs = Grid(conn.db);
    app.set('gridfs',gfs);
  });

  app.post('/createcourse',function(req,res){
      upload(req,res,function(err) {
          if(err) {
              return res.end("Error uploading file.");
          }
          // console.log(req);
          // console.log(req.files.userPhoto.path);
          // console.log(req.files.userPhoto.originalFilename);

          var writeStream = gfs.createWriteStream({
            filename: req.files.userPhoto.originalFilename
          });

          fs.createReadStream(req.files.userPhoto.path).pipe(writeStream);

          var course_name = "Course Name";
          var currentCourseVideos = [];

          // console.log(req);
          // console.log(req.files)
          var user = req.user.user;
          var email = user.email;

          User.findOne({ 'user.email' : email  }, function(err, user) {
                if (err){ return done(err);}
                // console.log(user);
                var courses = user.user.courses_created;
                if(courses.length > 0) {
                  for(var i=0; i<courses.length; i++) {
                    if(courses[i].course_name == "Course Name") {
                      // console.log("MAthced");
                      var newVideo = new Video();
                      newVideo.video_name = "Video name2";
                      newVideo.video_desc = "desc2";
                      newVideo.video_quiz_qn = "qn1";
                      newVideo.video_quiz_ans = "false";
                      newVideo.video_keyowords = "asd,dee";
                      currentCourse = courses[i];
                      // console.log(currentCourse);
                      user.user.courses_created[i].videos.push(newVideo);
                      // console.log(user.user.courses_created[i].videos);
                      currentCourseVideos = user.user.courses_created[i].videos;
                      // console.log(currentCourseVideos);
                      user.markModified('user');
                      user.save();
                    }
                  }
                } else {
                  var newCourse = new CourseCreated();
                  newCourse.course_name = "Course Name";
                  newCourse.course_desc = "Course Desc";
                  newCourse.course_genre = "Genre";
                  newCourse.author = "JJ";
                  newCourse.videos = [];
                  var newVideo = new Video();
                  newVideo.video_name = "Video name";
                  newVideo.video_desc = "desc";
                  newVideo.video_quiz_qn = "qn1";
                  newVideo.video_quiz_ans = "true";
                  newVideo.video_keyowords = "asd,dee";
                  newCourse.videos.push(newVideo);
                  user.user.courses_created.push(newCourse);
                  currentCourseVideos = newCourse.videos;
                  user.save();
                }
                // user.user.courses_created.course_name = course_name;
                // user.user.courses_created.videos.video_name = req.files.userPhoto.originalFilename;
                // 
                res.render('create_course.html', {
                  user : req.user.user,
                  currentCourseVideos : currentCourseVideos
                });
            });
          // res.end("File is uploaded");
          // 
            console.log("Pass data...");
            console.log(currentCourseVideos);
            // console.log(req.user.user);
            

          writeStream.on('close', function(file) {
            console.log(file.filename + 'Written to DB');
          });
      });
  });

}