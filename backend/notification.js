var Database = require("./database");
var Toolbox = require("./toolbox");

exports.N_EVENT = 1;
exports.N_MENTION = 2;
exports.N_CHAT = 3;
exports.N_BOARD = 4;
exports.N_PASS = 5;
exports.N_REPOST = 6;
exports.N_WHITELIST = 7;

exports.addUserNotification = function (user, notification, action, from, type) {
	if (user == from) return false;

	var query = "INSERT INTO `notifications` (`from`, `to`, `body`, `action`, `type`, `time`) ";
	query += "VALUES (";
	query += ~~(from) + ",";
	query += ~~(user) + ",";
	query += Database.escape(notification) + ",";
	query += Database.escape(action.toString()) + ",";
	query += ~~(type) + ",";
	query += Toolbox.time();
	query += ")";

	Database.query(query);
};

exports.getUserNotifications = function (userid, since, callback, args) {
	Database.query("SELECT * FROM `notifications` WHERE `to` = "+~~(userid)+" AND `read` = 0 AND `time` > "+(+since || 0)+" ORDER BY TIME DESC", callback, args);
}

