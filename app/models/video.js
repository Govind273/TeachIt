var mongoose = require('mongoose');

var videoSchema = mongoose.Schema({
		video_name	: String,
		video_desc  : String,
		video_quiz_qn : String,
		video_quiz_ans : Boolean,
		video_keyowords : { type: Array, "default" :[] },
		video_filename : String
});

videoSchema.methods.updateCourse = function(request, response){
	response.redirect('/course');
};



module.exports = mongoose.model('video', videoSchema);