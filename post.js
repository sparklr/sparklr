var database = require("./database");
var Notification = require("./notification");
var User = require("./user");

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

exports.post = function(user, data, callback) {
	var querystr = "INSERT INTO `timeline` (`from`, `time`, `message`, `public`) VALUES ("
	querystr += parseInt(user) + ",";
	querystr += Math.floor((new Date).getTime() / 1000) + ",";
	querystr += database.escape(data.body) + ",";
	querystr += "1";
	querystr += ");";
	database.query(querystr,function(err,rows) {
		processMentions(data.body, user, rows.insertId);
		callback(err,rows);
	});//callback);
	//processMentions(data.body, user, );
}
exports.postComment = function(user, data, callback) {
	database.getObject("timeline", data.id, function(err, rows) {
		if (rows.length < 1) {
			callback(false);
			return false;
		}
		if (rows[0].from != data.to) {
			callback(false);
			return false;
		}

		var query = "INSERT INTO `comments` (`postid`, `from`, `message`, `time`) ";
		query += "VALUES (" + parseInt(data.id) + ", " + parseInt(user) + ", "+database.escape(data.comment) + "," +  Math.floor((new Date).getTime() / 1000) + ")";

		database.query(query, callback);

		query = "SELECT DISTINCT `from` FROM `comments` WHERE postid = " + parseInt(data.id);
		database.query(query, function(err,rows) {
			var notified = false;
			for (i in rows) {
				if (rows[i].from == data.to) {
					notified = true;
				}
				Notification.addUserNotification(rows[i].from, "", data.id, user, 1);
			}

			if (!notified) {
				Notification.addUserNotification(data.to, "", data.id, user, 1);
			}
		});

		processMentions(data.comment, user, data.id);

	});
}

exports.repost = function(user, postid, reply) {
	database.getObject('timeline', postid, function(err,rows) {
		console.log(err);
		if (rows.length < 1) return;

		var post = rows[0];
		var msg;

		if (post.origid != null) {
			console.log("Has origid " + post.origid);

			msg = post.message;
		} else {
			msg = "[" + post.from + "] " + post.message;
		}
		if (reply != "") {
			msg += "\n[" + user + "] " + reply;
		}
		post.id = null;
		post.message = msg;
		post.from = user;
		post.time = Math.floor((new Date).getTime() / 1000);

		database.postObject('timeline', post, function(err,rows) {
			console.log(err);
		});
	});
}

function processMentions(post, mentioner, postid) {
	var matches = post.toString().match(/@([\w-]+)/gi);
	for (i in matches) {
		var user = matches[i].substring(1);
		User.getUserProfileByUsername(user, function(err,rows) {
			if (rows.length > 0) {
				Notification.addUserNotification(mentioner, "", postid, rows[0].id, Notification.N_REPOST);
				console.log("Notifying " + rows[0].id);
			}
		});
	}
}
