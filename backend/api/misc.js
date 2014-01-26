var Database = require('../database');
var Mail = require('../mail');

/* @url api/areyouawake
 * Stupid simple check if the server is replying
 * @returns true
 */
exports.public_areyouawake = function(args, callback) {
	callback(200, true);
}

/* @url api/staff
 * @returns JSON array of usernames and ids
 * @structure { id, username }
 */
exports.get_staff = function(args, callback) {
	Database.query("SELECT `id`,`username` FROM `users` WHERE `rank` = 100 OR `rank` = 50 ORDER BY `rank` DESC", callback);
}

/* @url api/feedback
 * @args { msg }
 * @post null
 * @returns true
 */
exports.post_feedback = function(args, callback) {
	Mail.sendMessageToEmail("jaxbot@gmail.com", "feedback", args.postObject, args.userobj);
	callback(200, true);
}

