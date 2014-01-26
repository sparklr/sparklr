var Database = require('../database');

/* @url api/notifications
 * @returns JSON array of notification objects
 * @structure { id, from, to, type, time, body, action }
 */
exports.get_notifications = function(args, callback) {
	Database.getStream("notifications", {
		to: [args.userobj.id],
	}, callback);
}

/* @url api/dismiss/:id
 * Dismisses a notification
 * @returns MySQL result
 * @structure { affectedRows, insertId }
 */
exports.get_dismiss = function(args, callback) {
	Database.deleteObject("notifications", {
		to: args.userobj.id,
		id: (+args.fragments[4] || 0)
	}, callback);
}
