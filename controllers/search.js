function after(scope) {
	if (scope.data.posts) {
	for (var i = scope.data.posts.length-1; i >=0; i--) {
			addTimelineEvent(scope.data.posts[i]);
		}
	}
}
