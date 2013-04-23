var database = require("./database");

exports.N_EVENT = 1;
exports.N_MENTION = 2;
exports.N_CHAT = 3;
exports.N_BOARD = 4;
exports.N_PASS = 5;
exports.N_REPOST = 6;

exports.addUserNotification = function (user, notification, action, from, type) {
	//if (user == from) return false;

	var query = "INSERT INTO `notifications` (`from`, `to`, `body`, `action`, `type`, `time`) ";
	query += "VALUES (";
	query += parseInt(from) + ",";
	query += parseInt(user) + ",";
	query += database.escape(notification) + ",";
	query += database.escape(action) + ",";
	query += parseInt(type) + ",";
	query += Math.floor((new Date).getTime() / 1000);
	query += ")";

	database.query(query);
};
