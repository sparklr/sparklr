var Database = require('../database');

exports.get_notifications = function(args, callback) {
	Database.getStream("notifications", {
		to: [args.userobj.id],
	}, callback);
}

exports.get_dismiss = function(args, callback) {
	Database.deleteObject("notifications", {
		to: args.userobj.id,
		id: (+args.fragments[4] || 0)
	}, callback);
}
