/* Sparklr
 * Notifications related API endpoints
 */

var Database = require('../database');

/* @url api/notifications
 * @returns JSON array of notification objects
 * @structure { id, from, to, type, time, body, action }
 */
exports.get_notifications = function(args, callback) {
	Database.getStream("notifications", {
		to: [args.userobj.id],
		read: 0
	}, callback);
}

/* @url api/dismiss/:id
 * Dismisses a notification
 * @returns MySQL result
 * @structure { affectedRows, insertId }
 */
//TODO: allows other people to dismiss other peoples' notifications
exports.get_dismiss = function(args, callback) {
	Database.query("UPDATE `notifications` SET `read` = 1 WHERE `id` = " + (~~args.fragments[3] || 0) + " AND `to` = " + (args.userobj.id),callback);
	/*Database.deleteObject("notifications", {
		to: args.userobj.id,
		id: (~~args.fragments[4] || 0)
	}, callback);*/
}

