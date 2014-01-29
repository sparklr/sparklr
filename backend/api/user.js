/* Sparklr
 * User action related API endpoints
 */

var Database = require("../database");
var User = require("../user");
var Post = require("../post");
var Toolbox = require("../toolbox");
var Mail = require("../mail");

var bcrypt = require("bcrypt");
var crypto = require("crypto");

/* @url api/signin/:user/:pass
 * @returns 200 and a cookie if session, 403 if invalid credentials
 * Use of this API will be discouraged once OAuth is implemented
 */
exports.public_signin = function(args,callback) {
	if (args.fragments.length < 5) return callback(400, false);

	var user = args.fragments[3];
	var pass = args.fragments[4];

	Database.query("SELECT * FROM `users` WHERE `username` = " + Database.escape(user) + " OR `email` = " + Database.escape(user), function(err,rows) 
	{
		if (rows.length < 1 || err) return callback(403, false);

		bcrypt.compare(pass, rows[0].password, function(err,match) {
			if (err || !match) {
				callback(403, false);
			} else {
				var sessionid = rows[0].id + "," + rows[0].authkey;
				return callback(200, true, {
					"Set-Cookie": "D=" + sessionid + "; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT",
					"Cache-Control": "no-cache"
				});
			}
		});
	});
}

/* @url api/signup/:inviteid/:username/:email/:password
 * @returns 200 and a cookie if session, 200, -1 if the invite does not exist
 * This API is intended only for use by the Sparklr website and is not supported
 * for third-party applications.
 */
exports.public_signup = function(args, callback) {
	if (!args.fragments[6]) return callback(400,false);

	var inviteid = args.fragments[3],
		username = args.fragments[4],
		email = args.fragments[5],
		password = args.fragments[6];

	Database.query("SELECT * FROM `invites` WHERE `id` = " + Database.escape(inviteid), function(err, inviterows) {
		if (err) return callback(500, false);
		if (!inviterows[0]) return callback(200, -1);

		if (username.length > 20) return callback(200, 1);

		username = username.replace(/[^A-Za-z0-9]/g, "");
		User.generatePass(password, function(err,pass) {

			var following = [68,4,6,24,36,25];

			if (inviterows[0].from && following.indexOf(inviterows[0].from) == -1)
				following.push(inviterows[0].from);

			following = following.join(",");

			User.getUserProfileByAnything(email, function(err, rows) {
				if (err) return callback(500, err);
				if (rows.length > 0) {
					return callback(200, 2);
				}

				Database.postObject("users", {
					username: username,
					password: pass,
					email: email,
					displayname: username,
					following: following,
					followers: "",
					networks: "0",
					authkey: User.generateAuthkey(username),
					bio: ""
				}, function(err, rows) {
					if (err) return callback(500, false);
					callback(200, 1);

					if (inviterows[0].from) {
						User.getUserProfile(inviterows[0].from, function(err, data) {
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
 
/* @url api/signoff
 * @returns true
 * Signs the user off and returns an empty cookie
 */
exports.public_signoff = function(args, callback) {
	callback(200, true, {
		"Set-Cookie": "D=; Path=/",
		"Cache-Control": "no-cache"
	});
}

/* @url api/forgot
 * @returns 200, 1 if successful, 200, 0 if user not found
 * Resets the user's password and emails a reset token to the user
 */
exports.public_forgot = function(args, callback) {
	var user = args.fragments[3];
	if (!user) return callback(400, false);

	User.getUserProfileByAnything(user, function(err, rows) {
		if (rows && rows.length > 0) {
			var token = crypto.randomBytes(30).toString("hex");
			rows[0].password = "RESET:" + token;
			Database.updateObject("users", rows[0]);

			Mail.sendMessage(rows[0].id, "forgot", {
				token: token
			});

			callback(200, 1);
		} else {
			callback(200, 0);
		}
	});
}

/* @url api/reset/:token/:newpassword
 * @returns 200, true if successful, 403, -2 reset token is wrong
 * Resets the user's password to :newpassword
 */
exports.public_reset = function(args, callback) {
	if (args.fragments.length < 6) return callback(400, false);
	User.getUserProfile(args.fragments[3], function(err, rows) {
		if (err) return callback(500, false);

		if (!rows || rows.length < 1) return callback(403,-2);

		if (rows[0].password != "RESET:" + args.fragments[4]) 
			return callback(403, -2);

		if (args.fragments[5].length < 3)
			return callback(400, 0);

		User.generatePass(args.fragments[5], function(err, hash) {
			if (err) return callback(500, false);

			rows[0].authkey = User.generateAuthkey(rows[0].id);
			rows[0].password = hash;

			Database.updateObject("users", rows[0], function(err, data) {
				if (err) {
					callback(500, -1);
				} else {
					callback(200, 1, {
						"Set-Cookie": "D=" + rows[0].id + "," + rows[0].authkey + "; Path=/"
					});
				}
			});
		});
	});
}

/* @url api/requestinvite/:email
 * @returns 200, true
 * Requests an invitation to the Sparklr beta
 */
exports.public_requestinvite = function(args, callback) {
	if (!args.fragments[3]) return callback(400, false);

	Database.postObject("newsletter", {
		email: args.fragments[3]
	}, callback);
}

/* @url api/checkusername/:user
 * @returns 200, true or false
 * Returns whether or not the username is in use
 */
exports.public_checkusername = function(args, callback) {
	User.getUserProfileByUsername(args.fragments[3], function(err, rows) {
		if (err) return callback(500, false);
		callback(200, rows && rows.length > 0 && rows[0].id != args.userobj.id);
	});
}

/* @url api/user/:userid[/mentions|/photos]
 * @returns JSON object of user and stream
 * @structure { user, handle, avatarid, background, following, name, bio }
 */
exports.get_user = function(args, callback) {
	
	var userid = args.fragments[3];

	User.getUserProfile(userid, function(err,users) {
		if (err) return callback(500, false);
		if (users.length < 1)
			return callback(404, false);

		var profile = users[0];

		var obj = {
			user: profile.id,
			handle: profile.username,
			avatarid: profile.avatarid,
			background: profile.background,
			following: (args.userobj.following.indexOf(profile.id.toString()) != -1),
			name: profile.displayname,
			bio: profile.bio
		};

		var table = "timeline";
		var query = {
			from: [profile.id]
		};

		if (args.fragments[4] == "photos") {
			query.type = 1;
		}

		var done = function(err, rows) {
			obj.timeline = rows;
			callback(err,obj);
		}

		if (args.fragments[4] == "mentions") {
			Post.getPostRowsFromKeyQuery("mentions", "user", profile.id.toString(), 0, 0, done);
		} else {
			Database.getStream(table, query, done);
		}
	});
}

/* @url api/invite
 * @returns String of invite ID
 */
exports.get_invite = function(args, callback) {
	Database.query("SELECT * FROM `invites` WHERE `from` = " + (+args.userobj.id),
		function(err,rows) {
			if (err) return callback(500, false);
			if (rows.length > 0) {
				callback(200,rows[0].id);
			} else {
				var id = Toolbox.hash(args.userobj.id + args.userobj.email + args.userobj.authkey);
				Database.query("INSERT INTO `invites` (`id`,`from`) VALUES ('" + id + "','" + (+args.userobj.id) + "')");
				callback(200,id);
			}
		}
	);
}

/* @url api/random
 * @returns Returns a random userid
 */
exports.get_random = function(args, callback) {
	Database.query("SELECT `id` FROM `users` AS users1\
		JOIN \
		(SELECT (RAND() * (SELECT MAX(id) FROM `users`)) as nid) AS users2 \
		WHERE users1.id >= users2.nid AND users1.id != " + (+args.userobj.id) + "\
		ORDER BY users1.lastseen DESC LIMIT 5", 
	function(err,rows) {
		var id = rows[Math.round(Math.random() * (rows.length - 1))].id;
		callback(200,id);
	});
}

/* @url api/friends
 * @returns Friends array
 */
exports.get_friends = function(args, callback) {
	callback(200, args.userobj.following);
}

/* @url api/settings
 * @returns User object
 */
exports.get_settings = function(args, callback) {
	args.userobj.password = null;
	callback(200, args.userobj);
}

/* @url api/username/:userids(csv)
 * @returns id, handle array
 */
exports.get_username = function(args, callback) {
	var users = args.fragments[3].split(",");
	User.getMassUserDisplayName(users,callback);
}

/* @url api/follow/:userid
 * @returns MySQL result or 0 if already following
 */
exports.post_follow = function(args, callback) {
	var tofollow = args.fragments[3];
	if (tofollow == args.userobj.id) 
		return callback("You can't follow yourself ugh.");

	if (args.userobj.following.indexOf(tofollow) === -1) {
		tofollow = +tofollow;

		args.userobj.following.push(tofollow);

		Database.updateObject("users", args.userobj, callback);
	} else {
		callback(200,0);
	}
}

/* @url api/unfollow/:userid
 * @returns MySQL result or 0 if not following
 */
exports.post_unfollow = function(args, callback) {
	var tofollow = args.fragments[3];
	if (args.userobj.following.indexOf(tofollow) !== -1) {
		tofollow = +tofollow;

		args.userobj.following.splice(args.userobj.following.indexOf(tofollow), 1);

		Database.updateObject("users", args.userobj, callback);
	} else {
		callback(200,0);
	}
}

/* @url api/sendinvite/:email
 * @returns true
 */
exports.post_sendinvite = function(args, callback) {
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

/* @url api/settings
 * @args { [username], [bio], [email], displayname }
 * @returns true if successful, false if validation fails
 */
exports.post_settings = function(args, callback) {
	if (args.postObject.username) {
		if (args.postObject.username.match(/^\d+$/)) {
			return callback(200, false);
		} else if (args.postObject.username.length > 20) {
			return callback(200, false);
		} else {
			args.userobj.username = args.postObject.username.replace(/[^A-Za-z0-9]/g, "");
		}
	}

	if (args.postObject.bio) {
		if (args.postObject.bio.length < 400) {
			args.userobj.bio = args.postObject.bio;
		} else {
			return callback(200, false);
		}
	}
	
	if (args.postObject.email) {
		if (args.postObject.email != args.userobj.email) {
			args.userobj.emailverified = 0;
		}
		args.userobj.email = args.postObject.email;
	}

	if (args.postObject.displayname.length > 25) {
		return callback(200, false);
		//message = "That display name is a little long...";
	} else if (args.postObject.displayname.length < 1) {
		return callback(200, false);
		//message = "You actually need a display name. I know, tough.";
	} else {
		args.userobj.displayname = args.postObject.displayname.replace(/(\<|\>|[\u273B]|[\u273C])/g, "");
	}
	if (args.userobj.rank == 50)
		args.userobj.displayname += "\u273B";
	if (args.userobj.rank == 100)
		args.userobj.displayname += "\u273C";


	User.getUserProfileByUsername(args.userobj.username, function(err, res) {
		if (err) return callback(500, false);
		if (res && res.length > 0 && res[0].id != args.userobj.id) {
			return callback(200, false);
			//message = "That username is taken :c";
		} else {
			Database.updateObject("users", args.userobj);
		}

		callback(200, true);
	});

}

/* @url api/password
 * @args { password, newpassword }
 * @returns authkey string if true, false if validation fails
 */
exports.post_password = function(args, callback) {
	bcrypt.compare(args.postObject.password, args.userobj.password, function(err, match) {
		if (err) callback(500, false);
		if (match) {
			User.generatePass(args.postObject.newpassword, function(err, newpass) {
				args.userobj.password = newpass;

				// should we reset the authkey here???
				Database.updateObject("users", args.userobj);
				callback(200, args.userobj.authkey);
			});
		} else {
			callback(200, { result: false, password: false });
		}
	});
}

/* @url api/list
 * @args { action: true to add, false to remove, userid }
 * @returns true
 */
exports.post_list = function(args, callback) {
	var list = (args.userobj.blacklist || "").split(",");

	if (args.postObject.action) {
		if (list.indexOf(args.postObject.user.toString()) === -1)
			list.push(args.postObject.user);
	} else {
		list.splice(list.indexOf(args.postObject.user.toString()), 1);
	}
	args.userobj.blacklist = list.join(",");

	Database.updateObject("users", args.userobj);
	callback(200, true);
}

/* @url api/avatar
 * @post base64 encoded image
 * @returns avatarid
 */
exports.post_avatar = function(args, callback) {
	args.userobj.avatarid = Toolbox.time();
	Database.updateObject("users", args.userobj);
	callback(200, args.userobj.avatarid);
}

/* @url api/header
 * @post base64 encoded image
 * @returns avatarid
 */
exports.post_header = function(args, callback) {
	args.userobj.avatarid = Toolbox.time();
	Database.updateObject("users", args.userobj);
	callback(200, args.userobj.avatarid);
}

/* @url api/deleteuser
 * @args { password }
 * @returns true or false
 */
exports.post_delete_user = function(args, callback) {
	bcrypt.compare(args.postObject.password, args.userobj.password, function(err, match) { 
		if (err) return callback(err);

		if (!match) return callback(200, false);

		Database.deleteObject("users", { id: args.userobj.id }, function(err) {
			if (err) return callback(err);
			Database.deleteObject("timeline", { from: args.userobj.id }, function(err) {
				Database.deleteObject("messages", { from: args.userobj.id }, function(err) {
					Database.deleteObject("comments", { from: args.userobj.id }, function(err) {
						if (err) return callback(err);
						callback(200, true);
					});
				});
			});
		});
	});
	/*
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
	*/
}

