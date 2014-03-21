var Database = require("./database");
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

exports.signup = function(args, callback) {
	var username = "guest" + Toolbox.time() + (Math.round(Math.random() * 10000));
	User.generatePass("guest", function(err,pass) {
		var following = [68,4,6,24,36,25];

		following = following.join(",");

		var obj = {
			username: username,
			password: pass,
			email: username + "@sparklr.me",
			displayname: username,
			following: following,
			networks: "0",
			authkey: this.generateAuthkey(username),
			bio: ""
		};

		Database.postObject("users", obj, function(err, rows) {
			if (err) return callback(false);
			callback(obj);
		});
	});
}
