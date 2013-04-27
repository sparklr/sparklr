var database = require("./database");
var toolbox = require("./toolbox");
var md5 = require("./md5");

var CACHE_DISPLAYNAME = [];

exports.verifyAuth = function(userid,authkey,callback) {
	this.getUserProfile(userid, function(err,rows) {
		callback(authkey == exports.getAuthkey(rows[0]), rows[0]);
	});
}

exports.getAuthkey = function(user) {
	return md5.hash(user.username + ":" + user.authkey + global.salt);
}

exports.getUserProfile = function(userid,callback) {
	database.query("SELECT * FROM `users` WHERE `id` = " + parseInt(userid), callback);
}

exports.getUserProfileByUsername = function(username,callback) {
	database.query("SELECT * FROM `users` WHERE `username` = " + database.escape(username), callback);
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
		callback (rows[0].password == md5.hash(pass), rows[0]);
	});
}

exports.updateActivity = function(userobj) {
	userobj.lastseen = toolbox.time();
	database.updateObject("users", userobj);
}
