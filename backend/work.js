// Main ranch
var user = require("./user");
var Post = require("./post");
var util = require("util");
var events = require("events");
var database = require("./database");
var async = require("async");
var toolbox = require("./toolbox");
var upload = require("./upload");

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "signoff":
			response.writeHead(200, { "Set-Cookie": "D=; Path=/" });
		response.end();
		return;
		case "signin":
			user.trySignin(fragments[3], fragments[4], function(result,userobj) { 
			if (result) { 
				var sessionid = userobj.id + "," + user.getAuthkey(userobj);
				console.log(sessionid);
				response.writeHead(200, { "Set-Cookie": "D="+sessionid+"; Path=/" });
				response.end();
			} else {
				response.writeHead(403);
				response.end();
			}
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
		user.verifyAuth(s[0],s[1], function(success, userobj) {
			if (!success) {
				console.log(s);
				response.writeHead(403);
				response.end();
				return;
			}

			userobj.following = userobj.following.split(",").filter(function(e) { return e; });
			userobj.followers = userobj.followers.split(",").filter(function(e) { return e; });
			if (request.method == "POST") {
				var postObject;
				try {
					postObject = JSON.parse(request.headers['x-data']);
				} catch (e) {
					response.writeHead(404, "fix this");
				}
				//TODO: verify data is done sending
				switch (fragments[2]) {
					case "post":
						console.log(postObject);
						if (postObject.img) {
							var f = function() {
								upload.handleUpload(postBody, userobj, { width: 590, height: 350 }, function(err,id) {
									postObject.img = id;
									Post.post(userobj.id, postObject, function (err) {
										sendObject(response,{});
									});
								});
							};
						if (dataComplete) {
							f();
						} else {
							request.on("end", f);
						}
					} else {
						Post.post(userobj.id, postObject, function (err) {
							sendObject(response,{});
						});
					}
					break;
					case "repost":
						Post.repost(userobj.id, postObject.id, postObject.reply);
					sendObject(response,{});
					break;
					case "comment":
						Post.postComment(userobj.id, postObject);
					sendObject(response,{});
					break;
					case "chat":
						database.postObject("messages", { from: userobj.id, to: parseInt(postObject.to), time: Math.floor((new Date).getTime() / 1000), message: postObject.message }, function(err,data) {
						sendObject(response,{});
					});
					break;
					case "board":
						database.postObject("boards", { from: userobj.id, color: 0, to: parseInt(postObject.to), time: toolbox.time(), message: postObject.message }, function (err, data) {
						console.log(err);
						sendObject(response,{});
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
					user.getUserProfileByUsername(userobj.username, function(err,res) {
						if (res && res.length > 0 && res[0].id != userobj.id) {
							result = false;
							message = "That username is taken :c";
						} else {
							database.updateObject("users", userobj);
						}

						sendObject(response, { result: result, message: message });
					});
					break;
					case "password":
						var result = { result: false, message: "" }; 
					var oldpass = user.generatePass(postObject.password);
					var newpass = user.generatePass(postObject.newpassword);

					console.log(userobj.password);
					if (userobj.password == oldpass) {
						result.result = true;
						userobj.password = newpass;
						database.updateObject("users", userobj);
						result.authkey = user.getAuthkey(userobj);
					} else {
						result.message = "Incorrect current password.";
					}
					sendObject(response, result);
					break;
					case "privacy":
						var result = { result: true, message: "" }; 
					userobj.private = (postObject.private ? 1 : 0);
					database.updateObject("users", userobj);
					sendObject(response, result);
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
								upload.handleUpload(postBody, userobj, { width: 50, height: 50, avatar: true }, function(err,id) {
									userobj.avatarid = toolbox.time();
									database.updateObject("users", userobj);
									sendObject(response, userobj.avatarid);
								});
							};
						if (dataComplete) {
							f();
						} else {
							request.on("end", f);
						}
						break;
				}
			} else {
				if (uri.pathname.indexOf("/beacon") !== -1) {
					user.updateActivity(userobj);

					var counter = 0;
					var interval = setInterval(function() {
						processGetRequest(request, response, uri, sessionid, userobj, function (data) {
							if (data.length != 0) {
								sendObject(response, { data: data });
								clearInterval(interval);
							}
						});
						database.getStream("notifications", { to: [userobj.id], since: uri.query.n }, function(err,rows) {
							if (rows.length > 0) {
								sendObject(response, { notifications: rows });
								clearInterval(interval);
							}
						});

						counter++;
						if (counter > 30) {
							clearInterval(interval);
							sendObject(response,[]);
						}

					}, 1000);

				} else { 
					processGetRequest(request, response, uri, sessionid, userobj, function(data) { 
						sendObject(response,data);
					});

				}
			}
		});
	}
}
function processGetRequest(request, response, uri, sessionid, userobj, callback) {
	var sendResponse = function(err) {
		if (err && typeof(err) != "undefined") {
			response.writeHead(400);
			response.write(JSON.stringify({error: true, err: err}));
		} else {
			response.writeHead(200);
		}
		response.end();
	}
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "post":
			//TODO: privacy
			var users;
			var posts;
			var comments;

			async.parallel([
				function (callback) {
					database.getObject("users", fragments[3], function(err,res) { 
						users = res;
						callback(err);
					});
				},
				function (callback) {
					database.getObject("timeline", fragments[4], function(err,res) {
						posts = res;
						callback(err);
					});
				},
				function (callback) {
					Post.getComments(fragments[3], 0, function(err,res) {
						comments = res;
						callback(err);
					});	
				}
			], function(err) {
				var obj = posts[0];
				if (obj.from != users[0].id)
					return do403(response, "User ID and post ID do not match");

				obj.fromhandle = users[0].username;

				obj.comments = comments;
				callback(obj);
			});
		break;
		case "comments":
			var since = uri.query.since || 0;
		Post.getComments(fragments[3], since, function(err,comments) {
			callback(comments);
		});	
		break;
		case "friends":
			var obj = { followers: userobj.followers, following: userobj.following }
		callback(obj);
		case "onlinefriends":
			var friends = [];
		for (i in userobj.following) {
			if (userobj.followers.indexOf(userobj.following[i]) !== -1)
				friends.push(userobj.following[i]);
		}

		user.getOnlineFriends(friends, function(err,onlinefriends) {
			callback(onlinefriends);
		});
		break;
		case "stream":
			var stream = parseInt(fragments[3]);
		var from;
		if (stream === 0) {
			from = userobj.following.slice(0); // get a copy, not a reference
			from.push(userobj.id);
		} else {
			from = [stream];
		}
		var args = { from: from };
		if (uri.query.since) {
			args.since = uri.query.since;
		}
		if (uri.query.starttime) {
			args.starttime = uri.query.starttime;
		}
		//TODO: parallel 

		database.getStream("timeline", args, function(err, rows) {
			var obj = { timeline: rows, length: rows.length }
			Post.getCommentCountsByStream(from, args.since || 0, args.starttime || 0, function(err,rows) {
				obj.length = rows.length || obj.timeline.length;
				obj.commentcounts = rows;
				callback(obj);
			});
		});
		break;
		case "photos":
			var from = userobj.following;
		from.push(userobj.id);

		database.getStream("timeline", { from: from, type: 1 }, function(err, rows) {
			callback(rows);
		});
		break;
		case "user":
			var userid = fragments[3];
		database.getObject("users", userid, function (err,users) {
			var profile = users[0];
			if (profile.private) {
				if (userid != userobj.id && (userobj.following.indexOf(userid) == -1 || userobj.followers.indexOf(userid) == -1)) {
					return do403(response, "not friends");  
				} 
			}

			var obj = { user: profile.id,
				handle: profile.username,
				avatarid: profile.avatarid,
				following: (userobj.followers.indexOf(profile.id) != -1),
				name: profile.displayname,
				bio: profile.bio };

				var table = (fragments[4] == "board" ? "boards" : "timeline");
				var args = { from: [profile.id] };

				if (fragments[4] == "photos") {
					args.type = 1;
				}
				if (table == "boards") {
					args.from = null;
					args.to = [profile.id];
				}

				database.getStream(table, args, function(err,rows) {
					obj.timeline = rows;
					if (table == "boards") 
						sendObject(response,obj);
					else {
						Post.getCommentCounts(rows, function(err,rows) {
							obj.commentcounts = rows;
							callback(obj);
						});
					}
				});
		});
		break;
		case "board":
			database.getStream("boards", { to: [fragments[3]], since: uri.query.since || 0, starttime: uri.query.starttime || 0 }, function(err,rows) {
			callback(rows);
		});
		break;
		case "chat":
			var from = parseInt(fragments[3]);
		var since = uri.query.since || 0;
		var starttime = uri.query.starttime || 0;

		database.getStream("messages", { from: [from, userobj.id], to: [userobj.id, from], since: since, starttime: starttime }, function(err,rows) {
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
		database.query(query, function(err,rows) {
			callback(rows);
		});
		break;
		case "follow":
			var tofollow = fragments[3];
		if (userobj.following.indexOf(tofollow) == -1) { 
			userobj.following.push(tofollow);
			async.parallel([ function(callback) { database.updateObject("users", userobj, callback); },
						   function(callback) {
							   database.getObject("users", tofollow, function(err,rows) {
								   var otheruser = rows[0];
								   otheruser.followers += "," + userobj.id;
								   database.updateObject("users", otheruser, callback);
							   });
						   }], sendResponse);
		} else {
			sendResponse();
		}
		break;
		case "unfollow":
			var tofollow = fragments[3];
		if (userobj.following.indexOf(tofollow) != -1) { 
			userobj.following.splice(userobj.following.indexOf(tofollow),1);

			async.parallel([ function(callback) { database.updateObject("users", userobj, callback); },
						   function(callback) {
							   database.getObject("users", tofollow, function(err,rows) {
								   var otheruser = rows[0];

								   otheruser.followers = otheruser.followers.split(",");
								   otheruser.followers.splice(otheruser.followers.indexOf(userobj.id),1);
								   database.updateObject("users", otheruser, callback);
							   });
						   }], sendResponse);

		} else {
			sendResponse();
		}
		break;
		case "settings":
			userobj.password = null;
			callback(userobj);
		break;
		case "checkusername":
			user.getUserProfileByUsername(fragments[3], function(err,rows) {
			if (rows && rows.length > 0 && rows[0].id != userobj.id) {
				callback(false);
			} else {
				callback(true);
			}
		});
		break;
		case "search":
			var results = {};
			var q = "%" + unescape(fragments[3]) + "%";
			async.parallel([ function(callback) { 
			database.query("SELECT `username`, `id` FROM `users` WHERE `username` LIKE " + database.escape(q) + " ORDER BY `lastseen` DESC LIMIT 30" , function(err,rows) {
			if (rows && rows.length > 0) {
				results.users = rows;
			}
			callback(err);
		}); 
			},
			function (callback) { 
				var query = "SELECT * FROM `timeline` WHERE `message` LIKE " + database.escape(q) + " ORDER BY `time` DESC LIMIT 30";
			database.query(query, function(err,rows) {
				if (rows && rows.length > 0) {
					results.posts = rows;
				}
				callback(err);
			});
			}], function(err) {
				//TODO: error handling
				callback(results);
			});
			break;
		case "delete":
			switch (fragments[3]) {
			case "notification":
				database.deleteObject("notifications", 
									  { to: userobj.id, id: fragments[4] },
									  function() {
										  sendObject(response,{});
									  });
									  break;
									  case "post":
										  database.deleteObject("timeline", 
																{ from: userobj.id, id: fragments[4] },
																function() {
																	sendObject(response,{});
																});
																break;
																case "comment":
																	database.deleteObject("comments", 
																						  { from: userobj.id, id: fragments[4] },
																						  function() {
																							  sendObject(response,{});
																						  });
																						  break;


		}
		break;
		default:
			/*response.writeHead(404);
			  response.write("I don't know what you're talking about: " + fragments[2]);
			  response.end();
			  */
			break;
	}
}

function sendObject(response,obj) {
	try { 
		response.writeHead(200);
		response.write(JSON.stringify(obj));
		response.end();
	} catch (e) {
		// disconnected
	}
}

function do403(response, info) {
	response.writeHead(403);
	response.write(JSON.stringify({ error: true, info: info }));
	response.end();
}

