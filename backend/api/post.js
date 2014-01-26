var Database = require('../database');
var Post = require('../post');
var Toolbox = require("../toolbox");

/* @url api/post/:id
 * @returns JSON array of post objects
 * TODO: structure
 */
exports.get_post = function(args, callback) {
	if (!args.fragments[3] || !+args.fragments[3]) return callback(400, false);
	var users;
	var posts;
	var comments;

	Database.getObject("timeline", args.fragments[3], function(err, res) {
		posts = res;
		if (!err && res.length > 0) {
			Post.getComments(args.fragments[3], 0, function(err, res) {
				if (err) return callback(err);

				comments = res;
				var obj = posts[0];
				obj.comments = comments;

				callback(err,obj);
			});
		} else {
			callback(404);
		}
	});
}

/* @url api/comments/:postid[?since=:time]
 * @returns JSON array of comment objects
 * @structure { id, postid, from, message, time }
 */
exports.get_comments = function(args, callback) {
	if (!args.fragments[3] || !+args.fragments[3]) return callback(400, false);
	var since = args.uri.query.since || 0;
	Post.getComments(args.fragments[3], since, callback);
}

/* @url api/stream/:network|:userid[?since=:time][&starttime=:time]
 * @returns JSON array of posts objects
 * TODO: structure
 */
exports.get_stream = function(args, callback) {
	var stream = args.fragments[3];

	if (!stream.match(/^\d+$/)) {
		args.uri.query.network = 1;
	} else {
		stream = (+stream);
	}

	var query = {};

	if (stream === "following") {
		query.from = args.userobj.following.slice(0); // get a copy, not a reference
		query.from.push(args.userobj.id);
	} else if (stream === "everything") {
		query.since = 1;
	} else if (args.uri.query.network) {
		query.networks = [stream.toString()];
	} else {
		query.from = [stream];
	}
	if (args.uri.query.since) {
		query.since = args.uri.query.since;
		query.modified = args.uri.query.since;
	}
	if (args.uri.query.starttime) {
		query.starttime = args.uri.query.starttime;
	}
	if (args.uri.query.photo)
		query.type = 1;

	Database.getStream("timeline", query, callback);
}

/* @url api/mentions/:userid[?since=:time][&starttime=:time]
 * @returns JSON array of posts objects
 * TODO: structure
 */
exports.get_mentions = function(args, callback) {
	var user = args.fragments[3];

	var since = args.uri.query.since;
	var starttime = args.uri.query.starttime;

	Post.getPostRowsFromKeyQuery("mentions", "user", user, since, starttime, callback);
}

/* @url api/tag/:tag[?since=:time][&starttime=:time]
 * @returns JSON array of posts objects
 * TODO: structure
 */
exports.get_tag =  function(args, callback) {	
	var tag = args.fragments[3];
	var since = args.uri.query.since;
	var starttime = args.uri.query.starttime;

	Post.getPostRowsFromKeyQuery("tags", "tag", tag, since, starttime, callback);
}

/* @url api/search/:query
 * @returns { users: array of user objects, posts: array of post objects }
 */
exports.get_search = function(args, callback) {
	var results = {};
	var q = "%" + unescape(args.fragments[3]) + "%";
	Database.query("SELECT `username`, `id` FROM `users` WHERE `displayname` LIKE " + Database.escape(q) + " OR `username` LIKE " + Database.escape(q) + " ORDER BY `lastseen` DESC LIMIT 30", function(err, rows) {
		if (rows && rows.length > 0) {
			results.users = rows;
		}
		var query = "SELECT * FROM `timeline` WHERE `message` LIKE " + Database.escape(q) + " ORDER BY `time` DESC LIMIT 30";
		Database.query(query, function(err, rows) {
			if (rows && rows.length > 0) {
				results.posts = rows;
			}
			callback(err, results);
			results = q = null;
		});
	});
}

/* @url api/deletepost/:id
 * @returns MySQL result
 */
exports.get_deletepost = function(args, callback) {
	if (!args.fragments[3] || !(+args.fragments[3])) return callback(400, false);
	Post.deletePost(args.userobj, +(args.fragments[3]), callback);
}

/* @url api/deletecomment/:id
 * @returns MySQL result
 */
exports.get_deletecomment = function(args, callback) {
	if (!args.fragments[3] || !(+args.fragments[3])) return callback(400, false);
	Post.deleteComment(args.userobj, +(args.fragments[3]) || 0, callback);
}

/* @url api/post
 * @args { message: string <= 500, [network: networkstring], [img: 1] }
 * @post [base64 encoded image]
 * @returns 200, true if successful, 400 if message too long, 403 if blacklisted by :to,
 * the int 2 if there are too many posts too frequently
 */
exports.post_post = function(args, callback) {
	if (args.postObject.body.length > 500)
		return callback(400, false);

	var data = args.postObject;
	var user = args.userobj.id;

	data.time = Toolbox.time();
	data.from = +user;
	data.body = data.body || "";

	Database.query("SELECT `time` FROM `timeline` WHERE `from` = " + (+user) + " AND `time` > " + (data.time - 30) + " LIMIT 2", function(err,rows) {
		if (err) return callback(500, false);
		if (rows && rows.length > 101) {
			return callback(200,2); // as in, 2 many posts
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

			Post.processPostTags(data.body, rows.insertId);		
			Post.processMentions(data.body, user, rows.insertId);
			for (i in data.tags) {
				if (data.tags[i].userid) {
					Post.mentionUser(data.tags[i].userid, data.from, rows.insertId);
				}
			}
			data.message = data.body;
			data.id = rows.insertId;

			callback(err,true);
		});
	});
}

exports.post_repost = function(args, callback) {
	if (args.postObject.img)
		args.postObject.reply = "[IMG" + args.postObject.img + "]" + args.postObject.reply;
	if (args.postObject.reply.length > 520) 
		return callback(400, false);

	Post.repost(args.userobj.id, args.postObject.id, args.postObject.reply, function(err) {
		if (err) return callback(500, false);
		callback(200, true);
	});
}

exports.post_comment = function(args, callback) {
	if (args.postObject.img)
		args.postObject.comment = "[IMG" + args.postObject.img + "]" + args.postObject.comment;
	if (args.postObject.comment.length > 520)
		return callback(400, false);
	Post.postComment(args.userobj.id, args.postObject, function(err) {
		callback(200, true);
	});
}

exports.post_editpost = function(args, callback) {
	Post.edit(args.userobj.id, args.postObject.id, args.postObject.body, args.userobj.rank, callback);
}

exports.post_editcomment = function(args, callback) {
	Post.editcomment(args.userobj.id, args.postObject.id, args.postObject.body, args.userobj.rank, callback);
}

exports.post_like = function(args, callback) {
	Database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(args.postObject.id) + " AND `from` = " + parseInt(args.userobj.id) + " AND message = 0xe2989d", function (err, rows) {
	if (rows.affectedRows > 0) {
		Post.updateCommentCount(args.postObject.id, -1);
		callback(200, { deleted: true });
		process.send({ t: 2, message: false, delta: true, id: parseInt(args.postObject.id), commentcount: -1, network: '0', from: 0 });
		return;
	}
	Post.postComment(args.userobj.id, { to: args.postObject.to, id: args.postObject.id, comment: "\u261D", like: true}, function(){});
	callback(200, true);
});
}

