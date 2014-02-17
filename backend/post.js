var Database = require("./database");
var Notification = require("./notification");
var User = require("./user");
var Toolbox = require("./toolbox");

exports.getComments = function(postid, since, callback) {
	var query = "SELECT * FROM comments WHERE postid=" + ~~(postid);
	if (since != 0) {
		query += " AND time > " + ~~(since);
	}
	// For some odd reason, this actually decreases execution time.
	query += " ORDER BY `time` ASC";
	Database.query(query, callback);
}

exports.postComment = function(user, data, callback) {
	Database.getObject("timeline", data.id, function(err, rows) {
		if (rows.length < 1) {
			callback(false);
			return false;
		}

		var query = "INSERT INTO `comments` (`postid`, `from`, `message`, `time`) ";
		query += "VALUES (" + ~~(data.id) + ", " + ~~(user) + ", "+Database.escape(data.comment) + "," +  Toolbox.time() + ")";

		Database.query(query, callback);

		var count = (rows[0].commentcount + 1 || 1);

		Database.query("UPDATE `timeline` SET commentcount = " + ~~(count) + ", modified = " + Toolbox.time() + " WHERE id=" + ~~(data.id));

		if (data.like) //only notify one person
			return Notification.addUserNotification(rows[0].from, data.comment, data.id, user, 1);

		query = "SELECT `from` FROM `comments` WHERE postid = " + ~~(data.id) + " ORDER BY `time` DESC LIMIT 7";
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

		exports.processMentions(data.comment, user, data.id);
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
		Database.query("DELETE FROM `comments` WHERE `postid` = " + ~~(id), callback);
	});
}

exports.updateCommentCount = function(postid, x) {
	Database.query("UPDATE `timeline` SET commentcount = commentcount + " + ~~(x) + ", modified = " + Toolbox.time() + " WHERE id=" + ~~(postid), function(){});
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
		query += " AND `time` > " + ~~(since);
	if (starttime)
		query += " AND `time` < " + ~~(starttime);


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
