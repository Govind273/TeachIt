var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
	course         			: {
	coursename				:String,
	coursedescription		:String,
    coursegenre        		:String
    }
});

courseSchema.methods.updateCourse = function(request, response){
	response.redirect('/course');
};



module.exports = mongoose.model('Course', courseSchema);