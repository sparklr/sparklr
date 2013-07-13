var database = require("./database");
var Notification = require("./notification");
var User = require("./user");
var Tags = require("./tags");
var toolbox = require("./toolbox");
var events = require("events");
var util = require("util");

exports.evt = new events.EventEmitter;

exports.getComments = function(postid, since, callback) {
	var query = "SELECT * FROM comments WHERE postid=" + parseInt(postid);
	if (since != 0) {
		query += " AND time > " + parseInt(since);
	}
	// For some odd reason, this actually decreases execution time.
	query += " ORDER BY `time` ASC";
	database.query(query, callback);
}

exports.post = function(user, data, callback) {
	data.time = Math.floor((new Date).getTime() / 1000);
	data.from = user;

	var querystr = "INSERT INTO `timeline` (`from`, `time`, `message`, `meta`, `type`, `public`) VALUES ("
	querystr += parseInt(user) + ",";
	querystr += data.time + ",";
	querystr += database.escape(data.body) + ",";

	var meta = "";
	if (data.img)
		meta = data.img;
	if (data.tags) {
		meta += "," + JSON.stringify(data.tags);
	}

	querystr += (meta ? database.escape(meta) : "\"\"") + ",";
	querystr += (data.img ? 1 : 0) + ",";
	querystr += "1";
	querystr += ");";
	database.query(querystr,function(err,rows) {
		if (err) return callback(err);
		Tags.processPostTags(data.body, rows.insertId);		
		processMentions(data.body, user, rows.insertId);
		data.message = data.body;
		data.id = rows.insertId;

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
		var count = (rows[0].commentcount + 1 || 1);
		database.query("UPDATE `timeline` SET commentcount = " + parseInt(count) + ", modified = " + toolbox.time() + " WHERE id=" + parseInt(data.id));

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
exports.deleteComment = function(user, id, callback) {
	database.getObject("comments", id, function(err, rows) {
		if (err || rows.length < 1) {
			callback(false);
			return false;
		}
		if (rows[0].from != user) {
			callback(false);
			return false;
		}

		var query = "DELETE FROM `comments` WHERE `id` = " + parseInt(id) + " AND `from` = " + parseInt(user);
		database.query(query, function(){});
		var count = (rows[0].commentcount - 1 || 0);
		database.query("UPDATE `timeline` SET commentcount = " + parseInt(count) + ", modified = " + toolbox.time() + " WHERE id=" + parseInt(data.id));
		callback(true);
	});
}

exports.updateCommentCount = function(postid, x) {
	database.query("UPDATE `timeline` SET commentcount = commentcount + " + parseInt(x) + ", modified = " + toolbox.time() + " WHERE id=" + parseInt(postid));
}

exports.repost = function(user, postid, reply, callback) {
	database.getObject('timeline', postid, function(err,rows) {
		console.log(err);
		if (rows.length < 1) return;

		var post = rows[0];
		var origfrom = rows[0].from;
		var msg;

		console.log(post);
		if (post.origid != null) {
			msg = post.message;
		} else {
			msg = "[" + post.from + "] " + post.message;
			post.origid = post.id;
		}
		if (reply != "") {
			msg += "\n[" + user + "] " + reply;
		}
		post.id = null;
		post.message = msg;
		post.via = post.from;
		post.from = user;
		post.time = toolbox.time();
		post.commentcount = 0;
		

		database.postObject('timeline', post, function(err,rows) {
			callback(err,rows);
			if (!err)
				Notification.addUserNotification(origfrom, "", rows.insertId, user, Notification.N_REPOST);
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

			database.postObject("mentions", { user: rows[0].id, postid: postid, time: toolbox.time() }, function(err) {
				if (err) console.log(err);
			});
			}
		});
	}
}

exports.getPostRowsFromKeyQuery = function(table, key, value, since, starttime, callback) {
	var query = "SELECT `postid` FROM " + database.escapeId(table) + " WHERE " + database.escapeId(key) + " = " + database.escape(value);
	if (since)
		query += " AND `time` > " + parseInt(since);
	if (starttime)
		query += " AND `time` < " + parseInt(starttime);


	database.query(query, function(err,rows) {
		if (err)
			return callback(err);

		if (rows.length < 1) {
			callback(null, []);
			return; 
		}
		var postids = [];
		for (id in rows)
			postids.push(rows[id].postid);
		
		database.getStream("timeline", { id: postids }, callback);
	});

}
