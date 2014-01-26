var Database = require("./database");
var Notification = require("./notification");
var User = require("./user");
var Toolbox = require("./toolbox");

exports.getComments = function(postid, since, callback) {
	var query = "SELECT * FROM comments WHERE postid=" + parseInt(postid);
	if (since != 0) {
		query += " AND time > " + parseInt(since);
	}
	// For some odd reason, this actually decreases execution time.
	query += " ORDER BY `time` ASC";
	Database.query(query, callback);
}

exports.edit = function(user, id, body, rank, callback) {
	if (body.length > 500) return callback(false);
	Database.query("SELECT * FROM `timeline` WHERE `id` = " + parseInt(id) + (rank >= 50 ? "" : " AND `from` = " + parseInt(user)), function(err,rows) {
		if (err || rows.length < 1)
			return callback(err || true);
		var message = "";
		if (rows[0].via) {
			var last = "";
			var lineexp = /\[([\d]+)\]([^$\[]*)/g; //line starts with [ID]
			rows[0].message = rows[0].message.replace(lineexp, function(match, num, text) {
				message += last;
				last = match;
				return "";
			});

			message += "[" + user + "] " + body;
		} else {
			message = body;
		}
		Database.query("UPDATE `timeline` SET `message` = " + Database.escape(message) + ", `modified` = '" + Toolbox.time() + "' WHERE `id` = " + parseInt(id) + (rank >= 50 ? "" : " AND `from` = " + parseInt(user)), callback);
	});
}

exports.editcomment = function(user, id, body, rank, callback) {
	if (body.length > 500) return callback(false);
	Database.query("UPDATE `comments` SET `message` = " + Database.escape(body) + " WHERE `id` = " + parseInt(id) + (rank >= 50 ? "" : " AND `from` = " + parseInt(user)), callback);
}

exports.postComment = function(user, data, callback) {
	Database.getObject("timeline", data.id, function(err, rows) {
		if (rows.length < 1) {
			callback(false);
			return false;
		}

		var query = "INSERT INTO `comments` (`postid`, `from`, `message`, `time`) ";
		query += "VALUES (" + parseInt(data.id) + ", " + parseInt(user) + ", "+Database.escape(data.comment) + "," +  Toolbox.time() + ")";

		Database.query(query, function(err,res) {
			process.send({ t: 0, postid: data.id, from: user, message: data.comment, time: Toolbox.time(), id: res.insertId });
			callback(err,res);
		});

		var count = (rows[0].commentcount + 1 || 1);

		process.send({ t: 2, message: false, id: data.id, commentcount: count, network: '0', from: 0 });

		Database.query("UPDATE `timeline` SET commentcount = " + parseInt(count) + ", modified = " + Toolbox.time() + " WHERE id=" + parseInt(data.id));

		if (data.like) //only notify one person
			return Notification.addUserNotification(rows[0].from, data.comment, data.id, user, 1);

		query = "SELECT `from` FROM `comments` WHERE postid = " + parseInt(data.id) + " ORDER BY `time` DESC LIMIT 7";
		var postfrom = rows[0].from;
		Database.query(query, function(err,rows) {
			var notified = {};
			
			// notify the poster
			rows.push({from: postfrom});
			
			for (i in rows) {
				if (notified[rows[i].from]) continue;
				Notification.addUserNotification(rows[i].from, data.comment, data.id, user, 1);
				notified[rows[i].from] = 1;
			}
		});

		processMentions(data.comment, user, data.id);
	});
}
exports.deletePost = function(userobj, id, callback) {
	var args = { id: id };
	if (userobj.rank < 50) {
		args.from = userobj.id;
	}
	Database.deleteObject("timeline", args, function(err,rows) {
		if (err || rows.affectedRows < 1) {
			callback(false);
			return false;
		}
		Database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(id), callback);
	});
}
exports.deleteComment = function(userobj, id, callback) {
	Database.getObject("comments", id, function(err, rows) {
		if (err || rows.length < 1) {
			callback(false);
			return false;
		}
		if (rows[0].from != userobj.id && userobj.rank < 50) {
			callback(false);
			return false;
		}

		var query = "DELETE FROM `comments` WHERE `id` = " + parseInt(id);
		if (userobj.rank < 50) 
			query += " AND `from` = " + parseInt(userobj.id);

		Database.query(query, function(){});
		exports.updateCommentCount(rows[0].postid, -1);
		process.send({ t: 2, message: false, delta: true, id: rows[0].postid, commentcount: -1, network: '0', from: 0 });
		process.send({ t: 0, postid: rows[0].postid, id: id, deleted: true });

		callback(null,true);
	});
}

exports.updateCommentCount = function(postid, x) {
	Database.query("UPDATE `timeline` SET commentcount = commentcount + " + parseInt(x) + ", modified = " + Toolbox.time() + " WHERE id=" + parseInt(postid), function(){});
}

exports.repost = function(user, postid, reply, callback) {
	Database.getObject('timeline', postid, function(err,rows) {
		if (rows.length < 1) return;

		var post = rows[0];
		var origfrom = rows[0].from;
		var msg;

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
		post.time = post.modified = Toolbox.time();
		post.commentcount = 0;

		Database.postObject('timeline', post, function(err,rows) {
			callback(err,rows);
			if (!err)
				Notification.addUserNotification(origfrom, "", rows.insertId, user, Notification.N_REPOST);
			post.t = 2;
			post.id = rows.insertId;
			process.send(post);
		});
	});
}

exports.processPostTags = function(body, id) {
	var tagregex =  /\B#([\w-]{1,40})/gi;
	var tags = body.match(tagregex);
	if (!tags) return;
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].substring(1);

		Database.postObject("tags", { postid: id, tag: tags[i], time: Toolbox.time() }, function(err) {
			if (err)
				console.log(err);
		});
	}
}

exports.processMentions = function(post, mentioner, postid) {
	var matches = post.toString().match(/@([\w-]+)/gi);
	for (i in matches) {
		var user = matches[i].substring(1);
		User.getUserProfileByUsername(user, function(err,rows) {
			if (rows.length > 0) {
				exports.mentionUser(rows[0].id, mentioner, postid);
			}
		});
	}
}

exports.mentionUser = function(userid, mentioner, postid) {
	Notification.addUserNotification(userid, "", postid, mentioner, Notification.N_MENTION);

	Database.postObject("mentions", { user: userid, postid: postid, time: Toolbox.time() }, function(err) {
		if (err) console.log(err);
	});
}

exports.getPostRowsFromKeyQuery = function(table, key, value, since, starttime, callback) {
	var query = "SELECT `postid` FROM " + Database.escapeId(table) + " WHERE " + Database.escapeId(key) + " = " + Database.escape(value);
	if (since)
		query += " AND `time` > " + parseInt(since);
	if (starttime)
		query += " AND `time` < " + parseInt(starttime);


	Database.query(query, function(err,rows) {
		if (err)
			return callback(err);

		if (rows.length < 1) {
			callback(null, []);
			return; 
		}
		var postids = [];
		for (id in rows)
			postids.push(rows[id].postid);
		
		Database.getStream("timeline", { id: postids }, callback);
	});
}
