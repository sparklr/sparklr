CONTROLLERS['search'] = {
	"after": function(data, fragments) {
		if (data.posts) {
			addTimelineItems(data.posts);
		}
	}
};

