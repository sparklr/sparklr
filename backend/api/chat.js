/* Sparklr
 * Chat related API endpoints
 */

var Database = require("../database");
var Toolbox = require("../toolbox");
var Notification = require("../notification");
var User = require("../user");

/* @url api/inbox
 * @returns JSON array of message objects
 * @structure { time, from, message }
 */
exports.get_inbox = function(args, callback) {
	Database.query("SELECT msgs.time,msgs.from,`message` FROM `messages` msgs\
		INNER JOIN (SELECT `from`, MAX(`time`) AS time\
		FROM `messages`\
		WHERE `to` = " + parseInt(args.userobj.id) + "\
		GROUP BY `from`\
		) msgmax ON msgmax.from = msgs.from\
		AND msgmax.time = msgs.time\
		ORDER BY msgs.time DESC", callback);
}

/* @url api/chat/:with[?since=:time][&starttime=:time]
 * @returns JSON array of message objects
 * @structure { time, from, message }
 */
exports.get_chat = function(args, callback) {
	var from = +(args.fragments[3]);
	var since = args.uri.query.since || 0;
	var starttime = args.uri.query.starttime || 0;

	Database.getStream("messages", {
		from: [from, args.userobj.id],
		to: [args.userobj.id, from],
		since: since,
		starttime: starttime
	}, callback);
}

/* @url api/chat
 * @args { to: userid, message: string <= 520, [img: 1] }
 * @post [base64 encoded image]
 * @returns 200, true if successful, 400 if message too long, 403 if blacklisted by :to
 */
exports.post_chat = function(args, callback) {
	args.postObject.to = +(args.postObject.to);
	if (args.postObject.to == args.userobj.id) return callback(400, false);

	if (args.postObject.img)
		args.postObject.message = "[IMG" + args.postObject.img + "]" + args.postObject.message;
	if (args.postObject.message.length > 520)
		return callback(400, false);

	User.getUserProfile(args.postObject.to, function(err,rows) {
		if (err || !rows || !rows[0]) return callback(500, false);

		rows[0].blacklist = (rows[0].blacklist || "").split(",");
		if (rows[0].blacklist.indexOf(args.userobj.id.toString()) !== -1)
			return callback(403, false);

		Database.postObject("messages", {
			from: args.userobj.id,
			to: args.postObject.to,
			time: Toolbox.time(),
			message: args.postObject.message
		}, function(err, data) {
			if (err) return callback(500, false);
			Notification.addUserNotification(parseInt(args.postObject.to), args.postObject.message, 0, args.userobj.id, Notification.N_CHAT);
			callback(200, true);
		});
	});

}

