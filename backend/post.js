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
	Database.query("UPDATE `timeline` SET `message` = " + Database.escape(body) + ", `modified` = '" + Toolbox.time() + "' WHERE `id` = " + parseInt(id) + (rank >= 50 ? "" : " AND `from` = " + parseInt(user)), callback);
}

exports.editcomment = function(user, id, body, rank, callback) {
	if (body.length > 500) return callback(false);
	Database.query("UPDATE `comments` SET `message` = " + Database.escape(body) + " WHERE `id` = " + parseInt(id) + (rank >= 50 ? "" : " AND `from` = " + parseInt(user)), callback);
}

exports.post = function(user, data, callback) {
	data.time = Toolbox.time();
	data.from = user;

	Database.query("SELECT `time` FROM `timeline` WHERE `from` = " + parseInt(user) + " AND `time` > " + (data.time - 30) + " LIMIT 2", function(err,rows) {
		if (err) return callback(err);
		if (rows && rows.length > 1) {
			return callback(null,2); // as in, 2 many posts
		}

		var querystr = "INSERT INTO `timeline` (`from`, `time`, `modified`, `message`, `meta`, `type`, `public`, `network`) VALUES ("
		querystr += parseInt(user) + ",";
		querystr += data.time + ",";
		querystr += data.time + ",";
		querystr += Database.escape(data.body) + ",";

		var meta = "";
		if (data.img)
			meta = data.img;
		if (data.tags) {
			meta += "," + JSON.stringify(data.tags);
		}

		querystr += (meta ? Database.escape(meta) : "\"\"") + ",";
		querystr += (data.img ? 1 : 0) + ",";
		querystr += "1,";
		querystr += (Database.escape(data.network || "0"));
		querystr += ");";

		Database.query(querystr,function(err,rows) {
			if (err) return callback(err);

			process.send({ t: 2, 
				id: rows.insertId, 
				from: parseInt(user), 
				message: data.body, 
				modified: Toolbox.time(), 
				time: Toolbox.time(),
				meta: meta,
				type: data.img ? 1 : 0,
				network: data.network || "0",
				via: null
			});

			processPostTags(data.body, rows.insertId);		
			processMentions(data.body, user, rows.insertId);
			for (i in data.tags) {
				if (data.tags[i].userid) {
					mentionUser(data.tags[i].userid, data.from, rows.insertId);
				}
			}
			data.message = data.body;
			data.id = rows.insertId;

			callback(err,"");
		});
	});
}
exports.postComment = function(user, data, callback) {
	Database.getObject("timeline", data.id, function(err, rows) {
		if (rows.length < 1) {
			callback(false);
			return false;
		}

		var query = "INSERT INTO `comments` (`postid`, `from`, `message`, `time`) ";
		query += "VALUES (" + parseInt(data.id) + ", " + parseInt(user) + ", "+Database.escape(data.comment) + "," +  Toolbox.time() + ")";

		Database.query(query, callback);
		
		process.send({ t: 0, postid: data.id, from: user, message: data.comment, time: Toolbox.time() });

		var count = (rows[0].commentcount + 1 || 1);
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

function processPostTags(body, id) {
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

function processMentions(post, mentioner, postid) {
	var matches = post.toString().match(/@([\w-]+)/gi);
	for (i in matches) {
		var user = matches[i].substring(1);
		User.getUserProfileByUsername(user, function(err,rows) {
			if (rows.length > 0) {
				mentionUser(rows[0].id, mentioner, postid);
			}
		});
	}
}

function mentionUser(userid, mentioner, postid) {
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
