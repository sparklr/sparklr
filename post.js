var database = require("./database");

exports.getComments = function(postid, callback) {
	database.query("SELECT * FROM comments WHERE postid=" + parseInt(postid), callback);
}

exports.getCommentCounts = function(posts, callback) {
	var query = "SELECT COUNT(`postid`), `postid` FROM `comments` WHERE `postid` IN (";
	for (var i = 0; i < posts.length - 1; i++)
		query += parseInt(posts[i].id) + ",";
	query += posts[posts.length - 1].id + ") GROUP BY `postid`";

	database.query(query, callback);
}

