// Handles the in-RAM tags
var toolbox = require("./toolbox");
var database = require("./database");

exports.getPostsByTag = function(tag, since, callback) {
	var query = "SELECT `postid` FROM `tags` WHERE `tag` = " + database.escape(tag);
	if (since)
		query += " AND `time` > " + parseInt(since);

	database.query(query, function(err,rows) {
		if (err)
			return callback(err);

		if (rows.length < 1) {
			callback(null, []);
			return; 
		}
		var postids = [];
		for (id in rows)
			postids.push(rows[id].postid);

		database.getStream("timeline", { id: postids }, callback);
	});
}

exports.processPostTags = function(body, id) {
	var tagregex =  /\B#([\w-]+)/gi;
	var tags = body.match(tagregex);
	if (!tags) return;
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].substring(1);

		database.postObject("tags", { postid: id, tag: tags[i], time: toolbox.time() }, function(err) {
			if (err)
				console.log(err);
		});
	}
}

