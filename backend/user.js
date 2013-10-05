var Database = require("./database");
var Mail = require("./mail");

var bcrypt = require("bcrypt");
var crypto = require("crypto");

exports.verifyAuth = function(userid,authkey,callback) {
	this.getUserProfile(userid, function(err,rows) {
		if (err || rows.length < 1 || !rows[0]) return callback(false);
		callback(authkey == rows[0].authkey, rows[0]);
	});
}

exports.generatePass = function(pass,callback) {
	bcrypt.hash(pass, 11, callback);
}

exports.generateAuthkey = function(user) {
	return user.toString() + crypto.randomBytes(20).toString("hex");
}

exports.getUserProfile = function(userid,callback) {
	Database.query("SELECT * FROM `users` WHERE `id` = " + parseInt(userid), callback);
}

exports.getUserProfileByUsername = function(username,callback) {
	Database.query("SELECT * FROM `users` WHERE `username` = " + Database.escape(username), callback);
}

exports.getUserProfileByAnything = function(query,callback) {
	Database.query("SELECT * FROM `users` WHERE `email` = " + Database.escape(query) + " OR `username` = " + Database.escape(query), callback);
}

exports.getMassUserDisplayName = function(users,callback) {
	// sanitize
	for (var i = 0; i < users.length; i++) {
		users[i] = parseInt(users[i]);
	}

	Database.query("SELECT `displayname`, `username`, `id`, `avatarid` FROM `users` WHERE `id` IN (" + users.join(",")+")", callback);
}

exports.trySignin = function(user,pass,response) {
	Database.query("SELECT * FROM `users` WHERE `username` = " + Database.escape(user) + " OR `email` = " + Database.escape(user), function(err,rows) 
	{
		if (rows.length < 1 || err) {
			response.writeHead(403);
			response.write("false");
			response.end();
			return;
		}
		bcrypt.compare(pass, rows[0].password, function(err,match) {
			if (err || !match) {
				response.writeHead(403);
				response.end();
			} else {
				var sessionid = rows[0].id + "," + rows[0].authkey;
				response.writeHead(200, {
					"Set-Cookie": "D=" + sessionid + "; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT",
					"Cache-Control": "no-cache"
				});
				response.end();
			}
			user = pass = err = rows = null;
		});
	});
}

exports.resetPassword = function(userobj) {
	var token = crypto.randomBytes(30).toString("hex");
	userobj.password = "RESET:" + token;
	Database.updateObject("users", userobj);
	return token;
}

exports.signupUser = function(inviteid, username, email, password, callback) {
	Database.query("SELECT * FROM `invites` WHERE `id` = " + Database.escape(inviteid), function(err, inviterows) {
		if (err) return callback(err);
		if (!inviterows[0]) return callback(err,1);

		if (username.length > 20) return callback(1);

		username = username.replace(/[^A-Za-z0-9]/g, "");
		exports.generatePass(password, function(err,pass) {

			var following = [68,4,6,24,36,25];
			if (inviterows[0].from && following.indexOf(inviterows[0].from) == -1)
				following.push(inviterows[0].from);
			following = following.join(",");

			exports.getUserProfileByAnything(email, function(err, rows) {
				if (err) return callback(err);
				if (rows.length > 0) {
					return callback(2);
				}

				Database.postObject("users", {
					username: username,
					password: pass,
					email: email,
					displayname: username,
					following: following,
					followers: "",
					networks: "0",
					authkey: exports.generateAuthkey(username),
					bio: ""
				}, function(err, rows) {
					if (err) return callback(err);
					callback(err, rows);

					if (inviterows[0].from) {
						exports.getUserProfile(inviterows[0].from, function(err, data) {
							if (err) return false;
							data[0].following += "," + rows.insertId;
							Database.updateObject("users", data[0]);
						});
					}
				});
			});
		});
	});
}

exports.deleteUser = function(userobj, postObject, callback) {
	bcrypt.compare(postObject.password, userobj.password, function(err, match) { 
		if (err) return callback(err);
		if (!match) return callback(null, false);

		Database.deleteObject("users", { id: userobj.id }, function(err) {
			if (err) return callback(err);
			Database.deleteObject("timeline", { from: userobj.id }, function(err) {
				Database.deleteObject("messages", { from: userobj.id }, function(err) {
					Database.deleteObject("comments", { from: userobj.id }, function(err) {
						if (err) return callback(err);
						callback(false, true);
					});
				});
			});
		});
	});
}

exports.follow = function(userobj, tofollow, callback) {
	if (tofollow == userobj.id) 
		return callback("You can't follow yourself ugh.");
	if (userobj.following.indexOf(tofollow) == -1) {
		tofollow = parseInt(tofollow);
		userobj.following.push(tofollow);

		Database.updateObject("users", userobj, callback);
	} else {
		callback(null,0);
	}
	return;
}

exports.unfollow = function(userobj, tofollow, callback) {
	if (userobj.following.indexOf(tofollow) != -1) {
		userobj.following.splice(userobj.following.indexOf(tofollow), 1);
		Database.updateObject("users", userobj, callback);
	} else {
		callback(null,0);
	}
}

exports.forgotPass = function(user, callback, response) {
	exports.getUserProfileByAnything(user, function(err, rows) {
		if (rows && rows.length > 0) {
			var token = exports.resetPassword(rows[0]);

			Mail.sendMessage(rows[0].id, "forgot", {
				token: token
			});

			callback(response, 1);
		} else {
			callback(response, 0);
		}
		request = userobj = uri = sessionid = null;
	});
}

