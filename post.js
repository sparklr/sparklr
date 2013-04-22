var database = require("./database");

exports.getComments = function(postid, callback) {
	database.query("SELECT * FROM comments WHERE postid=" + parseInt(postid), callback);
}
