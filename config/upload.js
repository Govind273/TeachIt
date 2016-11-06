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

  app.post('/addVideo',function(req,res){
      upload(req,res,function(err) {
          if(err) {
              return res.end("Error uploading file.");
          }
          // console.log(req);
          // console.log(req.files.userPhoto.path);
          // console.log(req.files.userPhoto.originalFilename);
          // console.log(req);
          console.log(req.body);
          // console.log(req.file);
          // console.log(req.files);


          var writeStream = gfs.createWriteStream({
            filename: req.file.originalname
          });

          fs.createReadStream(req.file.path).pipe(writeStream);

          var course_name = "Course Name";
          var currentCourseVideos = [];

          // console.log(req);
          var user = req.user.user;
          var email = user.email;
          // console.log(req.body);
          // console.log(req.file);

          User.findOne({ 'user.email' : email  }, function(err, user) {
                if (err){ return done(err);}
                // console.log(user);
                var courses = user.user.courses_created;
                // if(courses.length > 0) {
                  var i = 0;
                  for(i=0; i<courses.length; i++) {
                    if(courses[i].course_name == "Course Name") {
                      // console.log("MAthced");
                      var newVideo = new Video();
                      newVideo.video_name = req.body.video_name;
                      newVideo.video_desc = req.body.video_desc;
                      newVideo.video_quiz_qn = req.body.video_quizqn;
                      newVideo.video_quiz_ans = req.body.video_quizans;
                      newVideo.video_keyowords = req.body.video_keyword;
                      newVideo.video_filename = req.file.originalname;
                      currentCourse = courses[i];
                      // console.log(currentCourse);
                      user.user.courses_created[i].videos.push(newVideo);
                      // console.log(user.user.courses_created[i].videos);
                      currentCourseVideos = user.user.courses_created[i].videos;
                      // console.log(currentCourseVideos);
                      user.markModified('user');
                      user.save();
                      break;
                    }

                  }

                  if(i == courses.length) {
                  var newCourse = new CourseCreated();
                  newCourse.course_name = "Course Name";
                  newCourse.course_desc = "Course Desc";
                  newCourse.course_genre = "Genre";
                  newCourse.author = "JJ";
                  newCourse.videos = [];
                  var newVideo = new Video();
                  newVideo.video_name = req.body.video_name;
                  newVideo.video_desc = req.body.video_desc;
                  newVideo.video_quiz_qn = req.body.video_quizqn;
                  newVideo.video_quiz_ans = req.body.video_quizans;
                  newVideo.video_keyowords = req.body.video_keyword;
                  newVideo.video_filename = req.file.originalname;
                  newVideo.video_filename = req.file.originalname;
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
            // console.log("Pass data...");
            // console.log(currentCourseVideos);
            // console.log(req.user.user);
            

          writeStream.on('close', function(file) {
            console.log(file.filename + ' written to DB');
          });
      });
  });

}