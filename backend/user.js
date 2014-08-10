var Database = require("./database");
var Toolbox = require("./toolbox");
var log = require("./log");
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
	Database.query("SELECT * FROM `users` WHERE `id` = " + ~~(userid), callback);
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
		users[i] = +users[i];
	}

	Database.query("SELECT `displayname`, `username`, `id`, `avatarid` FROM `users` WHERE `id` IN (" + users.join(",")+")", callback);
}

exports.getUserBanned = function (ip, callback) {
	Database.query("SELECT `expires` FROM `ipbans` WHERE `ip` = " + Database.escape(ip) + " AND `expires` > " + Toolbox.time(), function (err, rows) {
		callback(rows && rows.length > 0);
	});
}

exports.signup = function(request, callback) {
	// make sure they arent gobbling up accounts
	var ip = request.headers['x-real-ip'];
	Database.query("SELECT `id` FROM `users` WHERE `ip` = " + Database.escape(ip) + " AND `created` > " + (Toolbox.time() - 3600), function (err, rows) {
		// no more than 3 accounts per hour
		if (rows && rows.length > 2) {
			log("Too many IPs: " + ip);
			return callback(2);
		}

		exports.getUserBanned(ip, function (result) {
			if (result) {
				log("IP banned: " + ip);
				callback(3);
			}

			var username = "newbie" + (Toolbox.time() - 1396396552) + (Math.round(Math.random() * 100)).toString();
			exports.generatePass("guest", function(err,pass) {
				var following = [68,4,6,24,36,25];

				following = following.join(",");

				var obj = {
					username: username,
					password: pass,
					email: username + "@sparklr.me",
					displayname: username,
					following: following,
					networks: "0",
					authkey: exports.generateAuthkey(username),
					bio: "",
					mutetime: 0,
					ip: request.headers['x-real-ip'],
					created: Toolbox.time()
				};

				Database.postObject("users", obj, function(err, rows) {
					if (err) return callback(false);
					obj.id = rows && rows.insertId;
					callback(obj);
				});
			});
		});
	});
}

