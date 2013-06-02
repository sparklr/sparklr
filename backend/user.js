var database = require("./database");
var toolbox = require("./toolbox");

var CACHE_DISPLAYNAME = [];

exports.verifyAuth = function(userid,authkey,callback) {
	this.getUserProfile(userid, function(err,rows) {
		callback(authkey == exports.getAuthkey(rows[0]), rows[0]);
	});
}

exports.getAuthkey = function(user) {
	if (!user) return false;
	return toolbox.hash(user.id + ":" + user.password + global.salt);
}

exports.generatePass = function(pass) {
	return toolbox.hash(pass); //TODO: salt
}

exports.getUserProfile = function(userid,callback) {
	database.query("SELECT * FROM `users` WHERE `id` = " + parseInt(userid), callback);
}

exports.getUserProfileByUsername = function(username,callback) {
	database.query("SELECT * FROM `users` WHERE `username` = " + database.escape(username), callback);
}

exports.getUserProfileByAnything = function(query,callback) {
	database.query("SELECT * FROM `users` WHERE `email` = " + database.escape(query) + " OR `username` = " + database.escape(query), callback);
}

exports.getMassUserDisplayName = function(following,callback) {
	var querystr = "SELECT `displayname`, `username`, `id` FROM `users` WHERE `id` IN (";
	for (var i = 0; i < following.length - 1; i++)
		querystr += "'" + following[i] + "',";
	querystr += "'" + following[following.length - 1] + "')";

	database.query(querystr, callback);
}

exports.getOnlineFriends = function(friends, callback) {
	var querystr = "SELECT `id` FROM `users` WHERE `id` IN (";

	for (var i = 0; i < friends.length - 1; i++)
		querystr += "'" + parseInt(friends[i]) + "',";
	querystr += "'" + parseInt(friends[friends.length - 1]) + "')";
	querystr += " AND `lastseen` > " + Math.floor(((new Date).getTime() / 1000) - 60);

	database.query(querystr, callback);
}

exports.getFollowers = function(userid,callback) {
	exports.getUserProfile(userid,function(userobj) {
		callback(userobj.followers.split(","));
	})
}

exports.getFollowing = function(userid,callback) {
	exports.getUserProfile(userid,function(userobj) {
		callback(userobj.following.split(","));
	})
}

exports.trySignin = function(user,pass,callback) {
	database.query("SELECT * FROM `users` WHERE `username` = " + database.escape(user) + " OR `email` = " + database.escape(user) + ";", function(err,rows) 
	{
		if (rows.length < 1) return callback(false);
		callback (rows[0].password == exports.generatePass(pass), rows[0]);
	});
}

exports.updateActivity = function(userobj) {
	userobj.lastseen = toolbox.time();
	database.updateObject("users", userobj);
}

exports.resetPassword = function(userobj) {
	var token = exports.generatePass((Math.random() * 1000).toString());
	userobj.password = "RESET:" + token; //placeholder. TODO: replace with real pass gen
	database.updateObject("users", userobj);
	return token;
}

exports.signupUser = function(inviteid, username, email, password, callback) {
	database.query("SELECT * FROM `invites` WHERE `id` = " + database.escape(inviteid), function(err, inviterows) {
		if (err) return callback(err);
		if (!inviterows[0]) return callback(1);

		username = username.replace(/[^A-Za-z0-9]/g, "");

		database.postObject("users", {
			username: username,
			password: exports.generatePass(password),
			email: email,
			displayname: username,
			following: inviterows[0].from,
			followers: inviterows[0].from,
			emailverified: 0
		}, function(err, rows) {
			if (err) return callback(err);
			callback(err, rows);
			
			exports.getUserProfile(inviterows[0].from, function(err, data) {
				if (err) return false;
				data[0].following += "," + rows.insertId;
				data[0].followers += "," + rows.insertId;
				database.updateObject("users", data[0]);
			});

			database.deleteObject("invites", inviterows[0]);
		});
	});
}
