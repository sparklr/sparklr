var Database = require('../database');
var Mail = require('../mail');

exports.public_areyouawake = function(args, callback) {
	callback(200, true);
}

exports.get_staff = function(args, callback) {
	Database.query("SELECT * FROM `users` WHERE `rank` = 100 OR `rank` = 50 ORDER BY `rank` DESC", callback);
}

exports.post_feedback = function(args, callback) {
	Mail.sendMessageToEmail("jaxbot@gmail.com", "feedback", args.postObject, args.userobj);
	callback(200, true);
}

