var database = require("./database");
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

exports.getMassUserDisplayName = function(userid,callback) {
	exports.getFollowing(userid, function(following) {

		var querystr = "SELECT `displayname`, `id` FROM `users` WHERE `id` IN (";
		for (var i = 0; i < following.length; i++)
			querystr += "'" + following[i] + "',";
		querystr += "'" + userid + "')";
		
		database.query(querystr, function(err,rows) {
			callback(rows);
		});

	});
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
