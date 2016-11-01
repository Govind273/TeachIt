async = require("async");
var path = require('path'),
    fs = require('fs');


module.exports = function(app, passport,server) {
	app.get('/', function(request, response) {
		response.render('index.html');
	});
};