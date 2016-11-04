

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
          console.log(req.files.userPhoto.path);
          console.log(req.files.userPhoto.originalFilename);

          var writeStream = gfs.createWriteStream({
            filename: req.files.userPhoto.originalFilename
          });

          fs.createReadStream(req.files.userPhoto.path).pipe(writeStream);

          writeStream.on('close', function(file) {
            console.log(file.filename + 'Written to DB');
          });

          res.end("File is uploaded");
      });
  });

}