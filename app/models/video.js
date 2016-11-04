var mongoose = require('mongoose');

var videoSchema = mongoose.Schema({
	video     		: {
		video_name	: String,
		video_desc  : String,
		video_quiz_qn : String,
		video_quiz_answer : Boolean,
		video_keyowords : { type: Array, "default" :[] }
    }
});

videoSchema.methods.updateCourse = function(request, response){
	response.redirect('/course');
};



module.exports = mongoose.model('video', videoSchema);