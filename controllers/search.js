CONTROLLERS['search'] = {};

CONTROLLERS['search'].after = function(data, fragments) {
	if (data.posts) {
	for (var i = data.posts.length-1; i >=0; i--) {
			addTimelineEvent(data.posts[i]);
		}
	}
	addTimelineArray(data.posts,subscribedStream);
}

