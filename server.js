var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path = require('path'),
    fs = require('fs');
var http = require('http');
var multer = require('multer');
var Grid = require('gridfs-stream');


var server = http.createServer(app)


var configDB = require('./config/database.js');

mongoose.connect(configDB.url); 

require('./config/passport')(passport); 

app.configure(function() {

	app.use(express.cookieParser());
	app.use(express.bodyParser()); 
	app.use(express.static(path.join(__dirname, 'public')));
	app.use('/scripts', express.static(__dirname + '/node_modules/material-design-lite/'));
	app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);
	app.use(express.session({ secret: 'teachit' })); 
	app.use(express.bodyParser({uploadDir:'./uploads'}));
	app.use(passport.initialize());
	app.use(passport.session()); 
	app.use(flash()); 

});


require('./app/routes.js')(app, passport,server); 
require('./config/upload.js')(app,server, multer, mongoose, Grid, fs); 

server.listen(port);
console.log('Listening  to  port ' + port);