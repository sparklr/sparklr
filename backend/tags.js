// Handles the in-RAM tags
var toolbox = require("./toolbox");

var postsWithTag = [];
var tagUpdateTimes = [];

exports.postsWithTag = function(tag) {
	return postsWithTag[tag] || [];
}

exports.newPostsWithTag = function(tag,time) {
	if (tagUpdateTimes[tag] && tagUpdateTimes[tag] > time) 
		return true;
	return false;
}

exports.processPostTags = function(body, id) {
	var tagregex =  /\B#([\w-]+)/gi;
	var tags = body.match(tagregex);
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].substring(1);
		console.log(tags[i]);
		if (!postsWithTag[tags[i]])
			postsWithTag[tags[i]] = [];
		if (postsWithTag[tags[i]].indexOf(id) != -1) continue;
		postsWithTag[tags[i]].push(id);
		tagUpdateTimes[tags[i]] = toolbox.time;
	}
}

