// Handles the in-RAM tags
var toolbox = require("./toolbox");
var database = require("./database");

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

