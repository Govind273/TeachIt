var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
	course         			: {
	coursename				:String,
	coursedescription		:String,
    coursegenre        		:String
    }
});