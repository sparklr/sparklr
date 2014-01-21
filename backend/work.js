/* Sparklr
 * API
 */

var util = require("util");
var events = require("events");
var bcrypt = require("bcrypt");

var User = require("./user");
var Post = require("./post");
var Notification = require("./notification");
var Mail = require("./mail");
var Database = require("./database");
var Toolbox = require("./toolbox");
var Upload = require("./upload");

var api = {
	chat: require('./api/chat'),
	notifications: require('./api/notifications'),
	post: require('./api/post'),
	user: require('./api/user')	
}

var public_endpoints = {};
var get_endpoints = {};
var post_endpoints = {};

public_endpoints["areyouawake"] = function(args, callback) {
	callback(200, true);
}
public_endpoints["signoff"] = function(args, callback) {
	callback(200, true, {
		"Set-Cookie": "D=; Path=/",
		"Cache-Control": "no-cache"
	});
}
public_endpoints["signin"] = User.trySignin;
public_endpoints["forgot"] = User.forgotPass;
public_endpoints["reset"] = User.resetPass;
public_endpoints["requestinvite"] = function(args, callback) {
	if (!args.fragments[3]) return callback(400, false);

	Database.postObject("newsletter", {
		email: args.fragments[3]
	}, callback);
}
public_endpoints["checkusername"] = User.checkusername;

get_endpoints["invite"] = User.invite;
get_endpoints["friends"] = User.friends;
get_endpoints["settings"] = User.settings;
get_endpoints["random"] = User.random;
get_endpoints["search"] = User.search;
get_endpoints["inbox"] = api.chat.inbox;
get_endpoints["notifications"] = api.notifications.notifications;
get_endpoints["staff"] = function(args, callback) {
	Database.query("SELECT * FROM `users` WHERE `rank` = 100 OR `rank` = 50 ORDER BY `rank` DESC", callback);
}
get_endpoints["post"] = api.post.getPost;
get_endpoints["comments"] = api.post.getComments;
get_endpoints["stream"] = api.post.getStream;
get_endpoints["mentions"] = api.post.getMentions;
get_endpoints["user"] = api.user.getUser;
get_endpoints["chat"] = api.chat.getChat;
get_endpoints["username"] = function(args, callback) {
	var users = args.fragments[3].split(",");
	User.getMassUserDisplayName(users,callback);
}
get_endpoints["follow"] = function(args, callback) {
	var tofollow = args.fragments[3];
	User.follow(args.userobj, tofollow, callback);
}
get_endpoints["unfollow"] = function(args, callback) {
	var tofollow = args.fragments[3];
	User.unfollow(args.userobj, tofollow, callback);
}
/* ??? twice?
get_endpoints["checkusername"] = function(args, callback) {
			User.getUserProfileByUsername(fragments[3], function(err, rows) {
				if (err) return do500(response, err);
				callback(rows && rows.length > 0 && rows[0].id != userobj.id);
			});
	callback(args.response, args.userobj);
}
*/
get_endpoints["search"] = function(args, callback) {
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
get_endpoints["sendinvite"] = function(args, callback) {
	var inviteid = Toolbox.hash((Math.random() * 1e5) + args.userobj.id + args.fragments[3]);
	Database.postObject("invites", {
		id: inviteid,
		from: args.userobj.id
	}, function(err, rows) {
		if (err) return callback(err);
		Mail.sendMessageToEmail(args.fragments[3], "invite", {
			invite: inviteid,
			from: args.userobj.displayname
		});
		callback(err, true);
	});
}
get_endpoints["tag"] = function(args, callback) {	
	var tag = args.fragments[3];
	var since = args.uri.query.since;
	var starttime = args.uri.query.starttime;

	Post.getPostRowsFromKeyQuery("tags", "tag", tag, since, starttime, callback);
}
get_endpoints["delete"] = function(args, callback) {
	if (args.fragments.length < 5 || !args.fragments[4])
		return callback(400, false);

	switch (args.fragments[3]) {
		case "notification":
			Database.deleteObject("notifications", {
				to: args.userobj.id,
				id: args.fragments[4]
			}, callback);
			break;
		case "post":
			//TODO: better sanitization
			Post.deletePost(args.userobj, +(args.fragments[4]) || 0, callback);
			break;
		case "comment":
			Post.deleteComment(args.userobj, +(args.fragments[4]) || 0, callback);
			break;
	}
}

post_endpoints["post"] = function(args, callback) {
	if (postObject.body.length > 500)
		return do400(response, 400, "Post too long");
	Post.post(userobj.id, postObject, callback);
}
post_endpoints["repost"] = function(args, callback) {
	if (postObject.img)
		postObject.reply = "[IMG" + postObject.img + "]" + postObject.reply;
	if (postObject.reply.length > 520) 
		return do400(response, 400, "Too long");

	Post.repost(userobj.id, postObject.id, postObject.reply, function(err) {
		if (err) return do500(response, err);
		sendObject(response, {});
	});
}
post_endpoints["comment"] = function(args, callback) {
	if (args.postObject.img)
		postObject.comment = "[IMG" + postObject.img + "]" + postObject.comment;
	if (postObject.comment.length > 520)
		return do400(response, 400, "Too long");
	Post.postComment(userobj.id, postObject, function(err) {
		sendObject(response, {});
	});
}
post_endpoints["editpost"] = function(args, callback) {
	Post.edit(userobj.id, postObject.id, postObject.body, userobj.rank, callback);
}
post_endpoints["editcomment"] = function(args, callback) {
	Post.editcomment(userobj.id, postObject.id, postObject.body, userobj.rank, callback);
}
post_endpoints["chat"] = function(args, callback) {
	postObject.to = parseInt(postObject.to);
	if (postObject.to == userobj.id) return do400(response, "stop that");

	if (postObject.img)
		postObject.message = "[IMG" + postObject.img + "]" + postObject.message;
	if (postObject.message.length > 520)
		return do400(response, 400, "Too long");
	
	User.getUserProfile(postObject.to, function(err,rows) {
		if (err || !rows || !rows[0]) return do500(response, err);

		rows[0].blacklist = (rows[0].blacklist || "").split(",");
		if (rows[0].blacklist.indexOf(userobj.id.toString()) !== -1)
			return do400(response, 403, "Blocked");

		Database.postObject("messages", {
			from: userobj.id,
			to: postObject.to,
			time: Toolbox.time(),
			message: postObject.message
		}, function(err, data) {
			if (err) return do500(response, err);
			Notification.addUserNotification(parseInt(postObject.to), postObject.message, 0, userobj.id, Notification.N_CHAT);
			sendObject(response, {});

			process.send({ t: 1, to: postObject.to, from: userobj.id, message: postObject.message, time: Toolbox.time() });
		});
	});

}
post_endpoints["like"] = function(args, callback) {
	Database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(postObject.id) + " AND `from` = " + parseInt(userobj.id) + " AND message = 0xe2989d", function (err, rows) {
	if (rows.affectedRows > 0) {
		Post.updateCommentCount(postObject.id, -1);
		sendObject(response, { deleted: true });
		process.send({ t: 2, message: false, delta: true, id: parseInt(postObject.id), commentcount: -1, network: '0', from: 0 });
		return;
	}
	Post.postComment(userobj.id, { to: postObject.to, id: postObject.id, comment: "\u261D", like: true}, function(){});
	sendObject(response, {});
});

}
post_endpoints["settings"] = function(args, callback) {
	var result = true;
	var message = "";
	if (postObject.username) {
		if (postObject.username.match(/^\d+$/)) {
			message = "That username is a number. (fact of the day)";
			result = false;
		} else if (postObject.username.length > 20) {
			message = "That username is a little long...";
			result = false;
		} else {
			userobj.username = postObject.username.replace(/[^A-Za-z0-9]/g, "");
		}
	}

	if (postObject.bio) {
		if (postObject.bio.length < 400) {
			userobj.bio = postObject.bio;
		} else {
			userobj.bio = postObject.bio.substring(0,397) + "...";
		}
	}
	
	if (postObject.email) {
		if (postObject.email != userobj.email) {
			userobj.emailverified = 0;
		}
		userobj.email = postObject.email;
	}

	if (postObject.displayname.length > 25) {
		message = "That display name is a little long...";
		result = false;
	} else if (postObject.displayname.length < 1) {
		message = "You actually need a display name. I know, tough.";
		result = false;
	} else {
		userobj.displayname = postObject.displayname.replace(/(\<|\>|[\u273B]|[\u273C])/g, "");
	}
	if (userobj.rank == 50)
		userobj.displayname += "\u273B";
	if (userobj.rank == 100)
		userobj.displayname += "\u273C";


	User.getUserProfileByUsername(userobj.username, function(err, res) {
		if (err) return do500(response, err);
		if (res && res.length > 0 && res[0].id != userobj.id) {
			result = false;
			message = "That username is taken :c";
		} else {
			Database.updateObject("users", userobj);
		}

		sendObject(response, {
			result: result,
			message: message
		});
	});

}
post_endpoints["password"] = function(args, callback) {
	
	var result = {
		result: false,
		message: ""
	};
	bcrypt.compare(postObject.password, userobj.password, function(err, match) {
		if (err) do500(response, err);
		if (match) {
			result.result = true;
			User.generatePass(postObject.newpassword, function(err, newpass) {
				userobj.password = newpass;
				// should we reset the authkey here???
				Database.updateObject("users", userobj);
				result.authkey = userobj.authkey;
				sendObject(response, result);
			});
		} else {
			result.message = "Incorrect current password.";
			sendObject(response, result);
		}
	});
}
post_endpoints["blacklist"] = function(args, callback) {
	sendObject(response, { result: true, message: "" });
}
post_endpoints["list"] = function(args, callback) {
	var list = (userobj.blacklist || "").split(",");

	if (postObject.action) {
		if (list.indexOf(postObject.user.toString()) === -1)
			list.push(postObject.user);
	} else {
		list.splice(list.indexOf(postObject.user.toString()), 1);
	}
	userobj.blacklist = list.join(",");

	Database.updateObject("users", userobj);
	sendObject(response, { result: true, message: "" });
}
post_endpoints["delete"] = function(args, callback) {
	var result = {};
	User.deleteUser(userobj, postObject, function(err,res) {
		if (err) {
			result.result = false;
			result.message = "An unknown error occurred";
		} else {
			if (res) {
				result.deleted = true;
				result.message = "Your account has been deleted.";
				result.result = true;
			} else {
				result.result = false;
				result.message = "Incorrect current password.";
			}
		}
		sendObject(response, result);
	});
}
post_endpoints["avatar"] = function(args, callback) {
	userobj.avatarid = Toolbox.time();
	Database.updateObject("users", userobj);
	sendObject(response, userobj.avatarid);
}
post_endpoints["header"] = function(args, callback) {
	userobj.avatarid = Toolbox.time();
	Database.updateObject("users", userobj);
	sendObject(response, Toolbox.time());
}
post_endpoints["feedback"] = function(args, callback) {
	Mail.sendMessageToEmail("jaxbot@gmail.com", "feedback", postObject, userobj);
	sendObject(response, true);
}

//hello world

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");

	var args = { request: request,
		response: response,
		uri: uri,
		sessionid: sessionid,
		fragments: fragments
	}

	var callback = function(err,res,headers) {
		apiResponse(response,err,res,headers);
	}

	if (f = public_endpoints[fragments[2]])
		return f(args, callback);

	var postBody = "";
	var dataComplete = false;

	if (request.method == "POST") {
		request.on("data", function(data) {
			postBody += data;
			if (postBody.length > 15728640) {
				postBody = null;
				response.writeHead(413);
				request.connection.destroy();
			}
		});
		request.on("end", function() {
			dataComplete = true;
			request.removeAllListeners("data");
			request.removeAllListeners("end");
		});
	}

	if (sessionid == null)
		return apiResponse(response, false, 403);

	var authkey_header = request.headers['x-x'];
	User.verifyAuth(sessionid.split(',')[0], authkey_header, function(success, userobj) {
		if (!success) {
			//return apiResponse(response, false, 403);
		}
		args.userobj = userobj;

		userobj.following = userobj.following.split(",").filter(Toolbox.filter);
		if (request.method == "POST") {
			if (!(endpoint = post_endpoints[fragments[2]]))
				return apiResponse(response, false, 404);

			var postObject;
			try {
				postObject = request.headers['x-data'] ? JSON.parse(request.headers['x-data']) : {};
			} catch (e) {
				log("Bad post data: " + request.headers['x-data']);
				log(e);
				return apiResponse(response, false, 500);
			}
				
			args.postObject = postObject;

			if (postObject.img) {
				var f = function() {
					var args = { allowGif: true, width: 400, height: 620 };
					var s = uri.pathname.split("/");
					if (s[2] == "post")
						args.width = 700;
					if (s[2] == "avatar") 
						args = { fullWidth: 200, fullHeight: 200, width: 50, height: 50, fill: true, id: userobj.id };
					if (s[2] == "header") 
						args = { noThumb: true, fill: true, id: userobj.id, category: "b" };
					
					Upload.handleUpload(postBody, userobj, args, function(err, id) {
						postBody = null;

						if (err) return do500(response, err);
						postObject.img = id;

						endpoint(args, apiResponse);
						
						f = null;
					});
				};
				dataComplete ? f() : request.on("end", f);
				return;
			} else {
				endpoint(args, callback);
			}
		} else {
			if (uri.pathname.indexOf("/beacon") !== -1) {
				Notification.getUserNotifications(userobj.id, uri.query.n, beaconNotifCallback, args);
			} else {
				if (!(endpoint = get_endpoints[fragments[2]]))
					return apiResponse(response, 404, false);
				endpoint(args, callback);
			}
		}
	});
}

function beaconNotifCallback(err, rows, args) {
	if (err) return apiResponse(args.response, err, 500);

	var obj = {};

	if (rows.length > 0)
		obj.notifications = rows;

	if ((endpoint = args.uri.pathname.split("/")[2]) && (f = get_endpoints[endpoint])) {
		f(args, function(status, data, headers) {
			obj.data = data;
			apiResponse(args.response, status, data, headers);
		});
	} else {
		apiResponse(args.response,404,obj);
		args = obj = null;
	}
}

function apiResponse(response, err, obj, headers) {
	var status = err || 200;	
	if (typeof(status) !== 'number') {
		status = 500;
		obj = false;
	}

	try {
		response.writeHead(status, headers || {
			"Cache-Control": "no-cache"
		});
		response.write(JSON.stringify(obj));
		response.end();
	} catch (e) {
		response = null;
		// disconnected
	}
	obj = null;
}

