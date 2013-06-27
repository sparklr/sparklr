// Main ranch
var User = require("./user");
var Post = require("./post");
var Notification = require("./notification");
var Mail = require("./mail");
var Tags = require("./tags");
var database = require("./database");
var toolbox = require("./toolbox");
var upload = require("./upload");
var util = require("util");
var events = require("events");
var bcrypt = require("bcrypt");
var async = require("async");

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "signoff":
			response.writeHead(200, {
				"Set-Cookie": "D=; Path=/"
			});
			response.write("true");
			response.end();
			return;
		case "signin":
			if (!fragments[3] || !fragments[4]) return do400(response, 403);
			User.trySignin(fragments[3], fragments[4], function(result, userobj) {
				if (result) {
					var sessionid = userobj.id + "," + userobj.authkey;
					console.log(sessionid);
					response.writeHead(200, {
						"Set-Cookie": "D=" + sessionid + "; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT"
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
								database.updateObject("users", rows[0], function(err, data) {
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
			database.postObject("newsletter", {
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
		if (postBody.length > 5242880) {
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
				console.log(s);
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
								upload.handleUpload(postBody, userobj, {
									width: 590,
									height: 350
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
						Post.repost(userobj.id, postObject.id, postObject.reply, function(err) {
							if (err) return do500(response, err);
							sendObject(response, {});
						});
						break;
					case "comment":
						Post.postComment(userobj.id, postObject);
						sendObject(response, {});
						break;
					case "like":
						database.query("DELETE FROM `comments` WHERE `postid` = " + parseInt(postObject.id) + " AND `from` = " + parseInt(userobj.id) + " AND message = 0xe2989d", function (err, rows) {
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
						database.postObject("messages", {
							from: userobj.id,
							to: parseInt(postObject.to),
							time: toolbox.time(),
							message: postObject.message
						}, function(err, data) {
							if (err) return do500(response, err);
							Notification.addUserNotification(parseInt(postObject.to), "", 0, userobj.id, Notification.N_CHAT);
							sendObject(response, {});
						});
						break;
					case "board":
						database.postObject("boards", {
							from: userobj.id,
							color: 0,
							to: parseInt(postObject.to),
							time: toolbox.time(),
							message: postObject.message
						}, function(err, data) {
							if (err) return do500(response, err);
							Notification.addUserNotification(parseInt(postObject.to),
								postObject.message,
								data.insertId,
								userobj.id,
								Notification.N_BOARD);
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
								database.updateObject("users", userobj);
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
									database.updateObject("users", userobj);
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
						var result = {
							result: true,
							message: ""
						};

						userobj.private = (postObject.private ? 1 : 0);
						database.updateObject("users", userobj);
						sendObject(response, result);
						break;
					case "delete": 
						var result = {};

						bcrypt.compare(postObject.password, userobj.password, function(err, match) { 
							if (err) do500(response, err);
							if (match) {
								result.result = true;
								for (var i = 0; i < userobj.followers.length; i++) {
									database.getObject("users", userobj.followers[i], function(err, rows) {
										if (err) return;
										if (rows.length < 1) return;
										var otherUser = rows[0];

										otherUser.following = otherUser.following.split(",");
										otherUser.following.splice(otherUser.following.indexOf(userobj.id), 1);
										database.updateObject("users", otherUser, function() {});
									});
								}
								for (var i = 0; i < userobj.following.length; i++) {
									database.getObject("users", userobj.following[i], function(err, rows) {
										if (err) return;
										if (rows.length < 1) return;
										var otherUser = rows[0];

										otherUser.followers = otherUser.followers.split(",");
										otherUser.followers.splice(otherUser.followers.indexOf(userobj.id), 1);
										database.updateObject("users", otherUser, function() {});
									});
								}
								database.deleteObject("users", { id: userobj.id }, function(err) {
									if (err) do500(response, err);
									async.parallel([
										function(callback) {
											database.deleteObject("timeline", { from: userobj.id }, callback);
										},
										function(callback) {
											database.deleteObject("comments", { from: userobj.id }, callback);
										}],
										function(err) {
											if (err) do500(response, err);
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
							userobj.bio = postObject.bio.replace(/(\<|\>)/g, "");
						}
						database.updateObject("users", userobj);
						sendObject(response, {});
						break;
					case "avatar":
						var f = function() {
							upload.handleUpload(postBody, userobj, {
								width: 50,
								height: 50,
								avatar: true
							}, function(err, id) {
								if (err) return do500(response, err);
								userobj.avatarid = toolbox.time();
								database.updateObject("users", userobj);
								sendObject(response, userobj.avatarid);
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

					var counter = 0;
					var obj = {};

					async.parallel([
						function(callback) {
							processGetRequest(request, response, uri, sessionid, userobj, function(data) {
								if (data.length != 0) {
									obj.data = data;
								}
								callback();
							});
						},
						function(callback) {
							database.getStream("notifications", {
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
	}
}

function processGetRequest(request, response, uri, sessionid, userobj, callback) {
	var fragments = uri.pathname.split("/");

	switch (fragments[2]) {
		case "friends":
			var obj = {
				followers: userobj.followers,
				following: userobj.following
			}
			callback(obj);
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

			database.getStream("timeline", {
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
					database.getObject("timeline", fragments[3], function(err, res) {
						posts = res;
						callback(err);
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
		case "stream":
			var stream = parseInt(fragments[3]);
			if (isNaN(stream)) {
				return do400(response, 400);
			}
			var from;
			if (stream === 0) {
				from = userobj.following.slice(0); // get a copy, not a reference
				from.push(userobj.id);
			} else {
				from = [stream];
			}
			var args = {
				from: from
			};
			if (uri.query.since) {
				args.since = uri.query.since;
				args.modified = uri.query.since;
			}
			if (uri.query.starttime) {
				args.starttime = uri.query.starttime;
			}

			database.getStream("timeline", args, function(err, rows) {
				if (err) return do500(response, err);

				var obj = {
					timeline: rows,
					length: rows.length
				}
				callback(obj);
			});
			break;
		case "user":
			var userid = fragments[3];
			database.getObject("users", userid, function(err, users) {
				if (err) return do500(response, err);
				if (users.length < 1) {
					return do400(response, 404, "no such user");
				}
				var profile = users[0];
				if (profile.private) {
					if (userid != userobj.id && (userobj.following.indexOf(userid) == -1 || userobj.followers.indexOf(userid) == -1)) {
						return do400(response, 403, {
							notFriends: true,
							following: userobj.following.indexOf(userid) != -1
						});
					}
				}

				var obj = {
					user: profile.id,
					handle: profile.username,
					avatarid: profile.avatarid,
					following: (userobj.following.indexOf(profile.id.toString()) != -1),
					name: profile.displayname,
					bio: profile.bio
				};

				var table = (fragments[4] == "board" ? "boards" : "timeline");
				var args = {
					from: [profile.id]
				};

				if (fragments[4] == "photos") {
					args.type = 1;
				}
				if (table == "boards") {
					args.from = null;
					args.to = [profile.id];
				}

				database.getStream(table, args, function(err, rows) {
					if (err) return do500(response, err);
					obj.timeline = rows;
					sendObject(response, obj);
				});
			});
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
		case "board":
			database.getStream("boards", {
				to: [fragments[3]],
				since: uri.query.since || 0,
				starttime: uri.query.starttime || 0
			}, function(err, rows) {
				if (err) return do500(response, err);
				callback(rows);
			});
			break;
		case "chat":
			var from = parseInt(fragments[3]);
			var since = uri.query.since || 0;
			var starttime = uri.query.starttime || 0;

			database.getStream("messages", {
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
			database.query(query, function(err, rows) {
				if (err) return do500(response, err);
				callback(rows);
			});
			break;
		case "follow":
			var tofollow = fragments[3];
			if (userobj.following.indexOf(tofollow) == -1) {
				tofollow = parseInt(tofollow);
				userobj.following.push(tofollow);

				async.parallel([
					function(callback) {
						database.updateObject("users", userobj, callback);
					},
					function(callback) {
						database.getObject("users", tofollow, function(err, rows) {
							if (err) return do500(response, err);
							if (rows.length < 1) return do400(response, 404);
							var otheruser = rows[0];
							otheruser.followers += "," + userobj.id;
							database.updateObject("users", otheruser, callback);
						});
					}
				], callback);
			} else {
				callback();
			}
			break;
		case "unfollow":
			var tofollow = fragments[3];
			if (userobj.following.indexOf(tofollow) != -1) {
				userobj.following.splice(userobj.following.indexOf(tofollow), 1);

				async.parallel([
					function(callback) {
						database.updateObject("users", userobj, callback);
					},
					function(callback) {
						database.getObject("users", tofollow, function(err, rows) {
							if (err) return do500(response, err);
							if (rows.length < 1) return do400(response, 404);
							var otherUser = rows[0];

							otherUser.followers = otherUser.followers.split(",");
							otherUser.followers.splice(otherUser.followers.indexOf(userobj.id), 1);
							database.updateObject("users", otherUser, callback);
						});
					}
				], callback);

			} else {
				callback();
			}
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
					database.query("SELECT `username`, `id` FROM `users` WHERE `username` LIKE " + database.escape(q) + " ORDER BY `lastseen` DESC LIMIT 30", function(err, rows) {
						if (rows && rows.length > 0) {
							results.users = rows;
						}
						callback(err);
					});
				},
				function(callback) {
					var query = "SELECT * FROM `timeline` WHERE `message` LIKE " + database.escape(q) + " ORDER BY `time` DESC LIMIT 30";
					database.query(query, function(err, rows) {
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
		case "invite":
			var inviteid = toolbox.hash((Math.random() * 1e5) + userobj.id + fragments[3]);
			database.postObject("invites", {
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
		case "tag":
			var tag = fragments[3];
			var postids = Tags.postsWithTag(tag);
			var since = uri.query.since;
			if (postids.length < 1 || (since && !Tags.newPostsWithTag(tag,since))) {
				return sendObject(response,[]);
			}
			database.getStream("timeline", { id: postids, since: since }, function(err,rows) {
				if (err) do500(response,err);
				callback(rows);
			});
			break;
		case "delete":
			if (fragments.length < 5 || !fragments[4])
				return do400(response, 400, "Missing arguments");

			switch (fragments[3]) {
				case "notification":
					database.deleteObject("notifications", {
						to: userobj.id,
						id: fragments[4]
					}, function() {
						sendObject(response, {});
					});
					break;
				case "post":
					database.deleteObject("timeline", {
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
		response.writeHead(200);
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
