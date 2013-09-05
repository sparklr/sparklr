// Main ranch
var User = require("./user");
var Post = require("./post");
var Notification = require("./notification");
var Mail = require("./mail");
var Tags = require("./tags");
var Database = require("./database");
var Toolbox = require("./toolbox");
var Upload = require("./upload");
var util = require("util");
var events = require("events");
var bcrypt = require("bcrypt");

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "areyouawake":
			response.writeHead(200);
			response.end("success");
			return;
		case "signoff":
			response.writeHead(200, {
				"Set-Cookie": "D=; Path=/",
				"Cache-Control": "no-cache"
			});
			response.end("true");
			return;
		case "signin":
			if (!fragments[3] || !fragments[4]) return do400(response, 403);
			User.trySignin(fragments[3], fragments[4], function(result, userobj) {
				if (result) {
					var sessionid = userobj.id + "," + userobj.authkey;
					response.writeHead(200, {
						"Set-Cookie": "D=" + sessionid + "; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT",
						"Cache-Control": "no-cache"
					});
					response.end();
				} else {
					response.writeHead(403);
					response.end();
				}
				request = userobj = uri = sessionid = null;
			});
			return;
		case "forgot":
			if (!fragments[3]) return do400(response, 400);
			User.getUserProfileByAnything(fragments[3], function(err, rows) {
				if (rows && rows.length > 0) {
					var token = User.resetPassword(rows[0]);

					Mail.sendMessage(rows[0].id, "forgot", {
						token: token
					});

					sendObject(response, 1);
				} else {
					sendObject(response, 0);
				}
				request = userobj = uri = sessionid = null;
			});
			return;
		case "reset":
			if (!fragments[3]) return do400(response, 400);
			User.getUserProfile(fragments[3], function(err, rows) {
				if (err) return do500(response, err);
				if (rows && rows.length > 0) {
					if (rows[0].password == "RESET:" + fragments[4]) {
						if (fragments[5].length < 3) {
							sendObject(response, 0);
						} else {
							User.generatePass(fragments[5], function(err, hash) {
								if (err) return do500(response, err);
								rows[0].authkey = User.generateAuthkey(rows[0].id);
								rows[0].password = hash;
								Database.updateObject("users", rows[0], function(err, data) {
									if (err) {
										sendObject(response, -1);
									} else {
										response.writeHead(200, {
											"Set-Cookie": "D=" + rows[0].id + "," + rows[0].authkey + "; Path=/"
										});
										response.end("1");
									}
								});
							});
						}
					} else {
						sendObject(response, -2);
					}
				}
			});
			return;
		case "requestinvite":
			if (!fragments[3]) return do400(response, 400);
			Database.postObject("newsletter", {
				email: fragments[3]
			}, function(err) {
				sendObject(response, err == null);
			});
			return;
		case "signup":
			if (!fragments[6]) return do400(response, 400);
			User.signupUser(fragments[3], fragments[4], fragments[5], decodeURIComponent(fragments[6]), function(err, rows) {
				sendObject(response, err || 1);
			});
			return;
		case "checkusername":
			if (!fragments[3]) return do400(response, 400);
			User.getUserProfileByUsername(fragments[3], function(err, rows) {
				if (err) return do500(response, err);
				sendObject(response, rows && rows.length > 0);
			});
			return;
	}

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

	if (sessionid != null) {
		var s = sessionid.split(",");
		if (s.length < 2) return do400(response, 400);
		var authkey_header = request.headers['x-x'];
		User.verifyAuth(s[0], authkey_header, function(success, userobj) {
			if (!success) {
				response.writeHead(403);
				response.end();
				return;
			}

			userobj.following = userobj.following.split(",").filter(Toolbox.filter);
			userobj.followers = userobj.followers.split(",").filter(Toolbox.filter);
			userobj.networks = (userobj.networks || "0").split(",").filter(Toolbox.filter);
			if (request.method == "POST") {
				var postObject;
				try {
					postObject = request.headers['x-data'] ? JSON.parse(request.headers['x-data']) : {};
				} catch (e) {
					return do500(response, e);
				}
				
				if (postObject.img) {
					var f = function() {
						var args = { allowGif: true, width: 400, height: 443 };
						var s = uri.pathname.split("/");
						if (s[2] == "post")
							args.width = 500;
						if (s[2] == "avatar") 
							args = { width: 50, height: 50, fill: true, id: userobj.id };
						if (s[2] == "background") 
							args = { id: userobj.id, category: "b" };
						
						Upload.handleUpload(postBody, userobj, args, function(err, id) {
							postBody = null;

							if (err) return do500(response, err);
							postObject.img = id;

							processPostRequest(request, response, postObject, uri, sessionid, userobj);
						});
					};
					dataComplete ? f() : request.on("end", f);
					return;
				} else {
					processPostRequest(request, response, postObject, uri, sessionid, userobj);
				}
			} else {
				if (uri.pathname.indexOf("/beacon") !== -1) {
					var args = { response: response, request: request, uri: uri, sessionid: sessionid, userobj: userobj };
					Notification.getUserNotifications(userobj.id, uri.query.n, beaconNotifCallback, args);
					
					return;
				} else {
					processGetRequest(request, response, uri, sessionid, userobj, function(err,rows) {
						if (err)
							do500(response,err);
						else
							sendObject(response,rows);
						err = rows = request = uri = sessionid = userobj = null;	
						return;
					});
					return;
				}
			}
		});
	} else {
		do400(response, 403);
	}
}

function processPostRequest(request, response, postObject, uri, sessionid, userobj) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "post":
			if (postObject.body.length > 300)
				return do400(response, 400, "Post too long");
			Post.post(userobj.id, postObject, function(err,res) {
				sendObject(response, res);
			});
		return;
		case "repost":
			if (postObject.img)
				postObject.reply = "[IMG" + postObject.img + "]" + postObject.reply;
			Post.repost(userobj.id, postObject.id, postObject.reply, function(err) {
				if (err) return do500(response, err);
				sendObject(response, {});
			});
		return;
		case "comment":
			if (postObject.img)
				postObject.comment = "[IMG" + postObject.img + "]" + postObject.comment;
			Post.postComment(userobj.id, postObject, function(err) {
				sendObject(response, {});
			});
		return;
		case "chat":
			postObject.to = parseInt(postObject.to);
			if (postObject.to == userobj.id) return do400(response, "stop that");

			if (postObject.img)
				postObject.message = "[IMG" + postObject.img + "]" + postObject.message;

			Database.postObject("messages", {
				from: userobj.id,
				to: postObject.to,
				time: Toolbox.time(),
				message: postObject.message
			}, function(err, data) {
				if (err) return do500(response, err);
				Notification.addUserNotification(parseInt(postObject.to), "", 0, userobj.id, Notification.N_CHAT);
				sendObject(response, {});
			});
		return;
		case "like":
			Database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(postObject.id) + " AND `from` = " + parseInt(userobj.id) + " AND message = 0xe2989d", function (err, rows) {
				if (rows.affectedRows > 0) {
					Post.updateCommentCount(postObject.id, -1);
					sendObject(response, { deleted: true });
					return;
				}
				Post.postComment(userobj.id, { to: postObject.to, id: postObject.id, comment: "\u261D", like: true});
				sendObject(response, {});
			});
		return;
		case "settings":
			var result = true;
			var message = "";
			if (postObject.username.length > 20) {
				message = "That username is a little long...";
				result = false;
			} else {
				userobj.username = postObject.username.replace(/[^A-Za-z0-9]/g, "");
			}

			if (postObject.email != userobj.email) {
				userobj.emailverified = 0;
			}

			userobj.email = postObject.email;

			if (postObject.displayname.length > 20) {
				message = "That display name is a little long...";
				result = false;
			} else {
				userobj.displayname = postObject.displayname.replace(/(\<|\>)/g, "");
			}

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
		break;
		case "password":
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
		break;
		case "privacy":
			userobj.private = (postObject.private ? 1 : 0);
			Database.updateObject("users", userobj);
			sendObject(response, { result: true, message: "" });
		break;
		case "list":
			var list = (postObject.type ? userobj.whitelist : userobj.blacklist);
			list = (list || "").split(",");

			if (postObject.action) {
				if (list.indexOf(postObject.user.toString()) === -1)
					list.push(postObject.user);
				if (postObject.type == 0)
					User.removeFollower(userobj, postObject.user, function(err){});
			} else {
				list.splice(list.indexOf(postObject.user.toString()), 1);
				if (postObject.type == 1)
					User.removeFollower(userobj, postObject.user, function(){});
			}

			if (postObject.type) {
				userobj.whitelist = list.join(",");
			} else {
				userobj.blacklist = list.join(",");
			}

			Database.updateObject("users", userobj);
			sendObject(response, { result: true, message: "" });
		break;
		case "delete": 
			var result = {};

			bcrypt.compare(postObject.password, userobj.password, function(err, match) { 
				if (err) do500(response, err);
				if (match) {
					result.result = true;
					for (var i = 0; i < userobj.followers.length; i++) {
						Database.getObject("users", userobj.followers[i], function(err, rows) {
							if (err) return;
							if (rows.length < 1) return;
							var otherUser = rows[0];

							otherUser.following = otherUser.following.split(",");
							otherUser.following.splice(otherUser.following.indexOf(userobj.id), 1);
							Database.updateObject("users", otherUser, function() {});
						});
					}
					for (var i = 0; i < userobj.following.length; i++) {
						Database.getObject("users", userobj.following[i], function(err, rows) {
							if (err) return;
							if (rows.length < 1) return;
							var otherUser = rows[0];

							otherUser.followers = otherUser.followers.split(",");
							otherUser.followers.splice(otherUser.followers.indexOf(userobj.id), 1);
							Database.updateObject("users", otherUser, function() {});
						});
					}
					Database.deleteObject("users", { id: userobj.id }, function(err) {
						if (err) do500(response, err);
						Database.deleteObject("timeline", { from: userobj.id }, function(err) {
							Database.deleteObject("comments", { from: userobj.id }, function(err) {
								if (err) do500(response, err);
								result.deleted = true;
								result.message = "Your account has been deleted.";
								sendObject(response, result);
							});
						});
					});
				} else {
					result.result = false;
					result.message = "Incorrect current password.";
					sendObject(response, result);
				}
			});
		break;
		case "profile":
			if (postObject.displayname.length < 30) {
				userobj.displayname = postObject.displayname.replace(/(\<|\>)/g, "");
			}
			if (postObject.bio.length < 300) {
				userobj.bio = postObject.bio;
			}
			Database.updateObject("users", userobj);
			sendObject(response, {});
		break;
		case "avatar":
			userobj.avatarid = Toolbox.time();
			Database.updateObject("users", userobj);
			sendObject(response, userobj.avatarid);
		break;
		case "background":
			if (postObject.remove) {
				userobj.background = 0;
				Database.updateObject("users", userobj);
				sendObject(response, true);
				return;
			}
			userobj.background = Toolbox.time();
			Database.updateObject("users", userobj, function() {
				sendObject(response, userobj.background);
			});
		break;
		case "feedback":
			Mail.sendMessageToEmail("jaxbot@gmail.com", "feedback", postObject, userobj);
			sendObject(response, true);
		break;
	}
}

function processGetRequest(request, response, uri, sessionid, userobj, callback) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "invite":
			Database.query("SELECT * FROM `invites` WHERE `from` = " + parseInt(userobj.id),
			function(err,rows) {
				if (err) return do500(response,err);
				if (rows.length > 0) {
					callback(null,rows[0].id);
				} else {
					var id = Toolbox.hash(userobj.id + userobj.email + userobj.authkey);
					Database.query("INSERT INTO `invites` (`id`,`from`) VALUES ('" + id + "','" + parseInt(userobj.id) + "')", function(){});
					callback(null,id);
				}
			});
				return;
		case "friends":
			callback(null, userobj.following);
			return;
		case "settings":
			userobj.password = null;
			callback(null,userobj);
			return;
		case "random":
			Database.query("SELECT `id` FROM `users` AS users1\
								JOIN \
								(SELECT (RAND() * (SELECT MAX(id) FROM `users`)) as nid) AS users2 \
								WHERE users1.id >= users2.nid AND users1.id != " + parseInt(userobj.id) + " ORDER BY users1.lastseen DESC LIMIT 5", 
			function(err,rows) {
				var id = rows[Math.round(Math.random() * (rows.length - 1))].id;
				callback(null,id);
			});
			return; 
		case "search":
			if (!fragments[3]) return callback(null,false);
			break;
		case "inbox":
			Database.query("SELECT msgs.time,msgs.from,`message` FROM `messages` msgs\
							INNER JOIN (SELECT `from`, MAX(`time`) AS time\
							FROM `messages`\
							WHERE `to` = " + parseInt(userobj.id) + "\
							GROUP BY `from`\
							) msgmax ON msgmax.from = msgs.from\
							AND msgmax.time = msgs.time\
							ORDER BY msgs.time DESC", callback);
			return;
		case "notifications":
			Database.getStream("notifications", {
				to: [userobj.id],
			}, callback);
			return;
		case "onlinefriends":
			callback(null,0);
			return;
		default:
			if (fragments.length < 4 || fragments[3] == "") {
				callback("Missing arguments: " + uri.pathname);
				return;
			}
	}

	switch (fragments[2]) {
		case "post":
			var users;
			var posts;
			var comments;
			Database.getObject("timeline", fragments[3], function(err, res) {
				posts = res;
				if (!err && res.length > 0) {
					User.getUserProfile(res[0].from, function(err, rows) {
						if (!err && rows.length > 0) {
							if (!User.canSeeUser(rows[0], userobj.id)) {
								return do400(response, 403);
							}
						}
						Post.getComments(fragments[3], 0, function(err, res) {
							if (err) {
								return do500(response, err);
							}
							if (posts.length < 1) {
								return do400(response, 404);
							}
							comments = res;
							var obj = posts[0];

							obj.comments = comments;
							callback(err,obj);
						});
					});
				} else {
					callback(err);
				}
			});
			break;
		case "comments":
			var since = uri.query.since || 0;
			Post.getComments(fragments[3], since, callback);
			break;
		case "stream":
			var stream = parseInt(fragments[3]);
			if (isNaN(stream)) {
				stream = fragments[3];
				uri.query.network = 1;
			}
			var args = {};
			if (stream === 0) {
				args.networks = userobj.networks.slice(0);
				args.from = userobj.following.slice(0); // get a copy, not a reference
				args.from.push(userobj.id);
			} else if (stream === "following") {
				args.from = userobj.following.slice(0); // get a copy, not a reference
				args.from.push(userobj.id);
			} else if (uri.query.network) {
				args.networks = [stream.toString()];
			} else {
				args.from = [stream];
			}
			if (uri.query.since) {
				args.since = uri.query.since;
				args.modified = uri.query.since;
			}
			if (uri.query.starttime) {
				args.starttime = uri.query.starttime;
			}
			if (uri.query.photo)
				args.type = 1;

			Database.getStream("timeline", args, callback);
			break;
		case "mentions":
			var user = fragments[3];

			var since = uri.query.since;
			var starttime = uri.query.starttime;

			Post.getPostRowsFromKeyQuery("mentions", "user", user, since, starttime, callback);
			break;
		case "user":
			var userid = fragments[3];
			if (!isNaN(parseInt(userid))) {
				User.getUserProfile(userid, cb);
			} else {
				User.getUserProfileByUsername(userid, cb);
			}
			function cb(err, users) {
				if (err) return do500(response, err);
				if (users.length < 1) {
					return do400(response, 404, "no such user");
				}
				var profile = users[0];
			
				if (!User.canSeeUser(profile, userobj.id)) {
					return do400(response, 403, {
						notFriends: true,
						following: userobj.following.indexOf(userid) != -1
					});
				}

				var obj = {
					user: profile.id,
					handle: profile.username,
					avatarid: profile.avatarid,
					background: profile.background,
					following: (userobj.following.indexOf(profile.id.toString()) != -1),
					name: profile.displayname,
					bio: profile.bio
				};

				var table = "timeline";
				var args = {
					from: [profile.id]
				};

				if (fragments[4] == "photos") {
					args.type = 1;
				}

				var done = function(err, rows) {
					obj.timeline = rows;
					callback(err,obj);
				}

				if (fragments[4] == "mentions") {
					Post.getPostRowsFromKeyQuery("mentions", "user", profile.id.toString(), 0, 0, done);
				} else {
					Database.getStream(table, args, done);
				}

			}
			break;
		case "chat":
			var from = parseInt(fragments[3]);
			var since = uri.query.since || 0;
			var starttime = uri.query.starttime || 0;

			Database.getStream("messages", {
				from: [from, userobj.id],
				to: [userobj.id, from],
				since: since,
				starttime: starttime
			}, callback);
			break;
		case "username":
			var users = fragments[3].split(",");
			var query = "SELECT `username`,`id` FROM `users` WHERE id IN (";
			for (var i = 0; i < users.length; i++) {
				users[i] = parseInt(users[i]);
			}
			query += users.join(",") + ")";
			Database.query(query, callback);
			break;
		case "networkinfo":
			Database.getObject("networks", fragments[3], callback);
			break;
		case "track":
			var totrack = fragments[3];
			if (userobj.networks.indexOf(totrack) === -1)
				userobj.networks.push(totrack);
			Database.updateObject("users", userobj, callback);
			break;
		case "untrack":
			var totrack = fragments[3];
			var index = userobj.networks.indexOf(totrack);
			if (index !== -1)
				userobj.networks.splice(index, 1);
			Database.updateObject("users", userobj, callback);
			break;
		case "follow":
			var tofollow = fragments[3];
			User.follow(userobj, tofollow, callback);
			break;
		case "unfollow":
			var tofollow = fragments[3];
			User.unfollow(userobj, tofollow, callback);
			break;
		case "checkusername":
			User.getUserProfileByUsername(fragments[3], function(err, rows) {
				if (err) return do500(response, err);
				callback(rows && rows.length > 0 && rows[0].id != userobj.id);
			});
			break;
		case "search":
			var results = {};
			var q = "%" + unescape(fragments[3]) + "%";
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
			break;
		case "sendinvite":
			var inviteid = Toolbox.hash((Math.random() * 1e5) + userobj.id + fragments[3]);
			Database.postObject("invites", {
				id: inviteid,
				from: userobj.id
			}, function(err, rows) {
				if (err) return callback(err);
				Mail.sendMessageToEmail(fragments[3], "invite", {
					invite: inviteid,
					from: userobj.displayname
				});
				callback(err, true);
			});
			break;
		case "tag":
			var tag = fragments[3];
			var since = uri.query.since;
			var starttime = uri.query.starttime;

			Post.getPostRowsFromKeyQuery("tags", "tag", tag, since, starttime, callback);
			break;
		case "delete":
			if (fragments.length < 5 || !fragments[4])
				return callback("Missing arguments");

			switch (fragments[3]) {
				case "notification":
					Database.deleteObject("notifications", {
						to: userobj.id,
						id: fragments[4]
					}, callback);
					break;
				case "post":
					Database.deleteObject("timeline", {
						from: userobj.id,
						id: fragments[4]
					}, callback);
					break;
				case "comment":
					Post.deleteComment(userobj.id, parseInt(fragments[4]), callback);
					break;
			}
			break;
		default:
			callback(400, "No such API endpoint");
			break;
	}
}

function beaconNotifCallback(err, rows, args) {
	if (err) return do500(args.response, err);

	var obj = {};

	if (rows.length > 0)
		obj.notifications = rows;

	if (args.uri.pathname.split("/")[2]) {
		processGetRequest(args.request, args.response, args.uri, args.sessionid, args.userobj, function(err,rows) {
			if (err) {
				do500(args.response, err);
			} else {
				obj.data = rows;
				sendObject(args.response,obj);
			}
			err = rows = obj = args = null;
		});
	} else {
		sendObject(args.response,obj);
		args = null;
	}
}

function sendObject(response, obj) {
	try {
		response.writeHead(200, {
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

function do400(response, code, info) {
	response.writeHead(code);
	response.write(JSON.stringify({
		error: true,
		info: info
	}));
	response.end();
}

function do500(response, err) {
	response.writeHead(500);
	response.write(JSON.stringify({
		error: true
	}));
	response.end();

	console.trace();
	console.log((new Date).toString() + ": 500Error: " + JSON.stringify(err, null, 3));
}
