CONTROLLERS['search'] = {};

CONTROLLERS['search'].after = function(data, fragments) {
	if (data.posts) {
		for (var i = 0; i < data.posts.length; i++) {
			addTimelineEvent(data.posts[i], true);
		}
	}
}

