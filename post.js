var database = require("./database");
var Notification = require("./notification");
var User = require("./user");
var events = require("events");
var util = require("util");

exports.evt = new events.EventEmitter;

exports.getComments = function(postid, since, callback) {
	var query = "SELECT * FROM comments WHERE postid=" + parseInt(postid);
	if (since != 0) {
		query += " AND time > " + parseInt(since);
	}
	database.query(query, callback);
}

exports.getCommentCounts = function(posts, callback) {
	var query = "SELECT COUNT(`postid`), `postid` FROM `comments` WHERE `postid` IN (";
	for (var i = 0; i < posts.length - 1; i++)
		query += parseInt(posts[i].id) + ",";
	query += posts[posts.length - 1].id + ") GROUP BY `postid`";

	database.query(query, callback);
}

exports.getCommentCountsByStream = function(from, since, callback) {
	var query = "SELECT COUNT(`postid`), `postid` FROM `comments` WHERE `postid` IN (";
	query += "select `id` from `timeline` where `from` in ("
	for (var i = 0; i < from.length - 1; i++)
		query += parseInt(from[i]) + ",";
	query += from[from.length - 1] + ") order by `time` desc ) ";
	query += "AND `time` > " + parseInt(since);
	query += " GROUP BY `postid` ORDER BY `time` DESC LIMIT 30";
	console.log(query);
	database.query(query, callback);
}


exports.post = function(user, data, callback) {
	data.time = Math.floor((new Date).getTime() / 1000);
	data.from = user;

	var querystr = "INSERT INTO `timeline` (`from`, `time`, `message`, `public`) VALUES ("
	querystr += parseInt(user) + ",";
	querystr += data.time + ",";
	querystr += database.escape(data.body) + ",";
	querystr += "1";
	querystr += ");";
	database.query(querystr,function(err,rows) {
		processMentions(data.body, user, rows.insertId);
		data.message = data.body;
		data.id = rows.insertId;

		exports.evt.emit("post", data);
		callback(err,rows);
	});//callback);
	//processMentions(data.body, user, );
	//
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
				Notification.addUserNotification(rows[i].from, data.comment, data.id, user, 1);
			}

			if (!notified) {
				Notification.addUserNotification(data.to, data.comment, data.id, user, 1);
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
				Notification.addUserNotification(rows[0].id, "", postid, mentioner, Notification.N_MENTION);
				console.log("Notifying " + rows[0].id);
			}
		});
	}
}
