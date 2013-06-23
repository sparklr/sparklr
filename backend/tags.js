// Handles the in-RAM tags
var toolbox = require("./toolbox");

var broker = global.broker;

exports.postsWithTag = function(tag) {
	return broker['poststagged_' + tag] || [];
}

exports.newPostsWithTag = function(tag,time) {
	if (broker['tagupdated_' + tag] > time) 
		return true;
	return false;
}

exports.processPostTags = function(body, id) {
	var tagregex =  /\B#([\w-]+)/gi;
	var tags = body.match(tagregex);
	if (!tags) return;
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].substring(1);

		if (!broker['poststagged_' + tags[i]])
			broker['poststagged_' + tags[i]] = [];

		if (broker['poststagged_' + tags[i]].indexOf(id) != -1) continue;

		broker['poststagged_' + tags[i]].push(id);
		broker['tagupdated_' + tags[i]] = toolbox.time();
		global.broker_set('poststagged_' + tags[i]);
		global.broker_set('tagupdated_' + tags[i]);
	}
}

