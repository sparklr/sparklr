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
var async = require("async");

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "areyouawake":
			response.writeHead(200);
			response.end("success");
			break;
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
			});
			return;
		case "reset":
			if (!fragments[3]) return do400(response, 400);
			User.getUserProfileByAnything(fragments[3], function(err, rows) {
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
			User.signupUser(fragments[3], fragments[4], fragments[5], fragments[6], function(err, rows) {
				sendObject(response, rows);
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
	});

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

			userobj.following = userobj.following.split(",").filter(function(e) {
				return e;
			});
			userobj.followers = userobj.followers.split(",").filter(function(e) {
				return e;
			});
			userobj.networks = (userobj.networks || "0").split(",").filter(function(e) {
				return e;
			});
			if (request.method == "POST") {
				var postObject;
				try {
					postObject = request.headers['x-data'] ? JSON.parse(request.headers['x-data']) : {};
				} catch (e) {
					return do500(response, e);
				}
				switch (fragments[2]) {
					case "post":
						if (postObject.body.length > 300)
							return do400(response, 400, "Post too long");
						if (postObject.img) {
							var f = function() {
								Upload.handleUpload(postBody, userobj, {
									width: 590,
									height: 443,
									allowGif: true
								}, function(err, id) {
									if (err) return do500(response, err);
									postObject.img = id;
									Post.post(userobj.id, postObject, function(err) {
										sendObject(response, {});
									});
								});
							};
							dataComplete ? f() : request.on("end", f);
						} else {
							Post.post(userobj.id, postObject, function(err) {
								sendObject(response, {});
							});
						}
						break;
					case "repost":
						if (postObject.postData) {
							var f = function() {
								Upload.handleUpload(postBody, userobj, { width: 500, height: 350, allowGif: true }, function (err, id) {
									if (err) return do500(response,err);
									postObject.reply = "[IMG" + id + "]" + postObject.reply;
									Post.repost(userobj.id, postObject.id, postObject.reply, function(err) {
										if (err) return do500(response, err);
										sendObject(response, {});
									});
								});
							};
							dataComplete ? f() : request.on("end", f);
						} else {
							Post.repost(userobj.id, postObject.id, postObject.reply, function(err) {
								if (err) return do500(response, err);
								sendObject(response, {});
							});
						}
						break;
					case "comment":
						if (postObject.postData) {
							var f = function() {
								Upload.handleUpload(postBody, userobj, { width: 500, height: 350, allowGif: true }, function (err, id) {
									if (err) return do500(response,err);
									postObject.comment = "[IMG" + id + "]" + postObject.comment;
									Post.postComment(userobj.id, postObject, function(err) {
										sendObject(response, {});
									});
								});
							};
							dataComplete ? f() : request.on("end", f);
						} else {
							Post.postComment(userobj.id, postObject);
							sendObject(response, {});
						}
						break;
					case "like":
						Database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(postObject.id) + " AND `from` = " + parseInt(userobj.id) + " AND message = 0xe2989d", function (err, rows) {
						if (rows.affectedRows > 0) {
							Post.updateCommentCount(postObject.id, -1);
							sendObject(response, { deleted: true });
							return;
						}
						Post.postComment(userobj.id, { to: postObject.to, id: postObject.id, comment: "\u261D"});
							sendObject(response, {});
						});
						break;
					case "chat":
						postObject.to = parseInt(postObject.to);
						if (postObject.to == userobj.id) return do400(response, "stop that");
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
						break;
					case "settings":
						var result = true;
						var message = "";
						userobj.username = postObject.username.replace(/[^A-Za-z0-9]/g, "");

						if (postObject.email != userobj.email) {
							userobj.emailverified = 0;
						}

						userobj.email = postObject.email;

						if (postObject.displayname.length > 30) {
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

						console.log(postObject);
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
									async.parallel([
										function(callback) {
											Database.deleteObject("timeline", { from: userobj.id }, callback);
										},
										function(callback) {
											Database.deleteObject("comments", { from: userobj.id }, callback);
										}],
										function(err) {
											if (err) do500(response, err);
											result.deleted = true;
											result.message = "Your account has been deleted.";
											sendObject(response, result);
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
						var f = function() {
							Upload.handleUpload(postBody, userobj, {
								width: 50,
								height: 50,
								fill: true,
								id: userobj.id
							}, function(err, id) {
								if (err) return do500(response, err);
								userobj.avatarid = Toolbox.time();
								Database.updateObject("users", userobj);
								sendObject(response, userobj.avatarid);
							});
						};
						dataComplete ? f() : request.on("end", f);
						break;
					case "background":
						var f = function() {
							if (postObject.remove) {
								userobj.background = 0;
								Database.updateObject("users", userobj);
								sendObject(response, true);
								return;
							}
							Upload.handleUpload(postBody, userobj, {
								id: userobj.id,
								category: "b"
							}, function(err, id) {
								if (err) return do500(response, err);
								userobj.background = Toolbox.time();
								Database.updateObject("users", userobj);
								sendObject(response, userobj.background);
							});
						};
						dataComplete ? f() : request.on("end", f);
						break;
					case "feedback":
						Mail.sendMessageToEmail("jaxbot@gmail.com", "feedback", postObject, userobj);
						sendObject(response, true);
						break;
				}
			} else {
				if (uri.pathname.indexOf("/beacon") !== -1) {
					User.updateActivity(userobj);

					var obj = {};

					async.parallel([
						function(callback) {
							if (!uri.pathname.split("/")[2]) return callback(null,{});
							processGetRequest(request, response, uri, sessionid, userobj, function(data) {
								if (data.length != 0) {
									obj.data = data;
								}
								callback();
							});
						},
						function(callback) {
							Database.getStream("notifications", {
								to: [userobj.id],
								since: uri.query.n
							}, function(err, rows) {
								if (err) return do500(response, err);
								if (rows.length > 0) {
									obj.notifications = rows;
								}
								callback();
							});
						}
					], function(err) {
						if (err) return do500(response, err);
						sendObject(response, obj);
					});
				} else {
					processGetRequest(request, response, uri, sessionid, userobj, function(data) {
						sendObject(response, data);
					});

				}
			}
		});
	} else {
		do400(response, 403);
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
					callback(rows[0].id);
				} else {
					var id = Toolbox.hash(userobj.id + userobj.email + userobj.authkey);
					Database.query("INSERT INTO `invites` (`id`,`from`) VALUES ('" + id + "','" + parseInt(userobj.id) + "')", function(){});
					callback(id);
				}
			});
				return;
		case "friends":
			var obj = {
				followers: userobj.followers,
				following: userobj.following
			}
			var processed = 0;
			var candidates = [];
			
			for (i in userobj.following) {
				Database.getObject("users", userobj.following[i], function(err, users) {
					processed++;
					if (!err && users[0] && users[0].following) {
						users[0].following = users[0].following.split(",");
						for (n in users[0].following) {
							var person = users[0].following[n];
							if (!person || person == userobj.id || userobj.following.indexOf(person) != -1) continue;
							candidates.push(person);
						}
					}
					if (processed == userobj.following.length)
						f();
				});
			}
			var f = function() {
				var results = {};
				for (i in candidates) {
					var n = candidates[i];
					results[n] = results[n] ? results[n] + 1 : 1;
				}
				var sorted = Object.keys(results);
				sorted.sort(function(a,b) {
					return results[a] < results[b];
				});
				obj.recommends = sorted.slice(0,3);
				callback(obj);
			}
			if (userobj.following.length < 1) 
				f();
			return;
		case "onlinefriends":
			var friends = [];
			for (i in userobj.following) {
				if (userobj.followers.indexOf(userobj.following[i]) !== -1)
					friends.push(userobj.following[i]);
			}

			User.getOnlineFriends(friends, function(err, onlinefriends) {
				if (err) return do500(response, err);

				callback(onlinefriends);
			});
			return;
		case "photos":
			var from = userobj.following;
			from.push(userobj.id);

			Database.getStream("timeline", {
				from: from,
				type: 1
			}, function(err, rows) {
				if (err) return do500(response, err);
				callback(rows);
			});
			return;
		case "settings":
			userobj.password = null;
			callback(userobj);
			return;
		case "random":
			Database.query("SELECT `id` FROM `users` AS users1\
								JOIN \
								(SELECT (RAND() * (SELECT MAX(id) FROM `users`)) as nid) AS users2 \
								WHERE users1.id >= users2.nid AND users1.id != " + parseInt(userobj.id) + " ORDER BY users1.lastseen DESC LIMIT 5", 
			function(err,rows) {
				var id = rows[Math.round(Math.random() * (rows.length - 1))].id;
				callback(id);
			});
			return; 
		case "search":
			if (!fragments[3]) return callback(false);
			break;
		case "inbox":
			Database.query("SELECT msgs.time,msgs.from,`message` FROM `messages` msgs\
							INNER JOIN (SELECT `from`, MAX(`time`) AS time\
							FROM `messages`\
							WHERE `to` = " + parseInt(userobj.id) + "\
							GROUP BY `from`\
							) msgmax ON msgmax.from = msgs.from\
							AND msgmax.time = msgs.time\
							ORDER BY msgs.time DESC",
			function(err,rows) {
				if (err) return do500(response,err);
				callback(rows);
			});
			return;
		default:
			if (fragments.length < 4 || fragments[3] == "") {
				return do400(response, 400, "Missing arguments");
			}
	}

	switch (fragments[2]) {
		case "post":
			//TODO: privacy
			var users;
			var posts;
			var comments;

			async.parallel([
				function(callback) {
					Database.getObject("timeline", fragments[3], function(err, res) {
						posts = res;
						if (!err && res.length > 0) {
							User.getUserProfile(res[0].from, function(err, rows) {
								if (!err && rows.length > 0) {
									if (!User.canSeeUser(rows[0], userobj.id)) {
										return do400(response, 403);
									}
								}
								callback(err);
							});
						} else {
							callback(err);
						}
					});
				},
				function(callback) {
					Post.getComments(fragments[3], 0, function(err, res) {
						comments = res;
						callback(err);
					});
				}
			], function(err) {
				if (err) {
					return do500(response, err);
				}
				if (posts.length < 1) {
					return do400(response, 404);
				}
				var obj = posts[0];

				obj.comments = comments;
				callback(obj);
			});
			break;
		case "comments":
			var since = uri.query.since || 0;
			Post.getComments(fragments[3], since, function(err, comments) {
				if (err) return do500(response, err);
				callback(comments);
			});
			break;
			fragments[3] = "0";
		case "stream":
			var stream = parseInt(fragments[3]);
			if (isNaN(stream)) {
				return do400(response, 400);
			}
			var args = {};
			if (stream === 0) {
				/*args.from = userobj.following.slice(0); // get a copy, not a reference
				args.from.push(userobj.id);*/
				args.networks = userobj.networks.slice(0);
			} else if (uri.query.network) {
				args.networks = [stream];
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

			Database.getStream("timeline", args, function(err, rows) {
				if (err) return do500(response, err);
				var obj = {
					timeline: rows,
					length: rows.length
				}
				callback(obj);
			});
			break;
		case "mentions":
			var user = fragments[3];

			var since = uri.query.since;
			var starttime = uri.query.starttime;

			Post.getPostRowsFromKeyQuery("mentions", "user", user, since, starttime, function(err,rows) {
				if (err) do500(response,err);
				callback(rows);
			});
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
					if (err) return do500(response, err);
					obj.timeline = rows;
					sendObject(response, obj);
				}

				if (fragments[4] == "mentions") {
					Post.getPostRowsFromKeyQuery("mentions", "user", profile.id.toString(), 0, 0, done);
				} else {
					Database.getStream(table, args, done);
				}

			}
			break;
		case "userid":
			var handle = fragments[3];
			User.getUserProfileByUsername(handle, function(err, rows) {
				if (err) return do500(response, err);
				if (!rows[0]) {
					do400(response, 404, "User not found");
				} else {
					callback(rows[0].id);
				}
			});
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
			}, function(err, rows) {
				if (err) return do500(response, err);
				callback(rows);
			});
			break;
		case "username":
			var users = fragments[3].split(",");
			var query = "SELECT `username`,`id` FROM `users` WHERE id IN (";
			for (var i = 0; i < users.length; i++) {
				users[i] = parseInt(users[i]);
			}
			query += users.join(",") + ")";
			Database.query(query, function(err, rows) {
				if (err) return do500(response, err);
				callback(rows);
			});
			break;
		case "track":
			var totrack = fragments[3];
			if (!userobj.trackedtags)
				userobj.trackedtags = "";
			userobj.trackedtags = userobj.trackedtags.split(",");
			if (userobj.trackedtags.indexOf(totrack) === -1)
				userobj.trackedtags.push(totrack);
			Database.updateObject("users", userobj, callback);
			break;
		case "untrack":
			var totrack = fragments[3];
			if (!userobj.trackedtags)
				userobj.trackedtags = "";
			userobj.trackedtags = userobj.trackedtags.split(",");
			var index = userobj.trackedtags.indexOf(totrack);
			if (index !== -1)
				userobj.trackedtags.splice(index, 1);
			Database.updateObject("users", userobj, callback);
			break;
		case "follow":
			var tofollow = fragments[3];
			if (tofollow == userobj.id) 
				return do400(response, "You can't follow yourself ugh.");
			if (userobj.following.indexOf(tofollow) == -1) {
				tofollow = parseInt(tofollow);
				userobj.following.push(tofollow);

				Database.getObject("users", tofollow, function(err, rows) {
					if (err) return do500(response, err);
					if (rows.length < 1) return do400(response, 404);

					var otheruser = rows[0];
					if (!User.canSeeUser(otheruser, userobj.id))
						return do400(response, 403);

					otheruser.followers += "," + userobj.id;
					async.parallel([
						function(callback) {
							Database.updateObject("users", otheruser, callback);
						},
						function(callback) {
							Database.updateObject("users", userobj, callback);
						}
					], callback);
				});
			} else {
				callback();
			}
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
			async.parallel([
				function(callback) {
					Database.query("SELECT `username`, `id` FROM `users` WHERE `displayname` LIKE " + Database.escape(q) + " OR `username` LIKE " + Database.escape(q) + " ORDER BY `lastseen` DESC LIMIT 30", function(err, rows) {
						if (rows && rows.length > 0) {
							results.users = rows;
						}
						callback(err);
					});
				},
				function(callback) {
					var query = "SELECT * FROM `timeline` WHERE `message` LIKE " + Database.escape(q) + " ORDER BY `time` DESC LIMIT 30";
					Database.query(query, function(err, rows) {
						if (rows && rows.length > 0) {
							results.posts = rows;
						}
						callback(err);
					});
				}
			], function(err) {
				if (err) return do500(response, err);
				callback(results);
			});
			break;
		case "sendinvite":
			var inviteid = Toolbox.hash((Math.random() * 1e5) + userobj.id + fragments[3]);
			Database.postObject("invites", {
				id: inviteid,
				from: userobj.id
			}, function(err, rows) {
				if (err) return do500(response, err);
				Mail.sendMessageToEmail(fragments[3], "invite", {
					invite: inviteid,
					from: userobj.displayname
				});
				sendObject(response, true);
			});
			break;
		case "requestwhitelist":
			Notification.addUserNotification(fragments[3], "", 0, userobj.id, Notification.N_WHITELIST);
			sendObject(response,true);
			break;
		case "tag":
			var tag = fragments[3];
			var since = uri.query.since;
			var starttime = uri.query.starttime;

			Post.getPostRowsFromKeyQuery("tags", "tag", tag, since, starttime, function(err,rows) {
				if (err) do500(response,err);
				callback(rows);
			});
			break;
		case "delete":
			if (fragments.length < 5 || !fragments[4])
				return do400(response, 400, "Missing arguments");

			switch (fragments[3]) {
				case "notification":
					Database.deleteObject("notifications", {
						to: userobj.id,
						id: fragments[4]
					}, function() {
						sendObject(response, {});
					});
					break;
				case "post":
					Database.deleteObject("timeline", {
						from: userobj.id,
						id: fragments[4]
					}, function() {
						sendObject(response, {});
					});
					break;
				case "comment":
					Post.deleteComment(userobj.id, parseInt(fragments[4]), function(err) {
						sendObject(response, {});
					});
					break;
			}
			break;
		default:
			do400(response, 404, "No such API endpoint");
			break;
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
		// disconnected
	}
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

	console.log(err);
	console.trace();
}
