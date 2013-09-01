var Database = require("./database");

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
	query += parseInt(from) + ",";
	query += parseInt(user) + ",";
	query += database.escape(notification) + ",";
	query += database.escape(action.toString()) + ",";
	query += parseInt(type) + ",";
	query += Math.floor((new Date).getTime() / 1000);
	query += ")";

	Database.query(query,function(){});
};

function getUserNotifications(userid, since, callback) {
	Database.query("SELECT * FROM `notifications` WHERE `to` = "+parseInt(userid)+" AND `time` > "+parseInt(since)+" ORDER BY TIME DESC", callback);
}

exports.getUserNotifications = getUserNotifications;
