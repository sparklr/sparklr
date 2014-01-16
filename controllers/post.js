function before(scope) {
	scope.data = processPostMeta(scope.data);
}

function after(scope) {
	for (var i = 0; i < scope.data.comments.length; i++) {
		renderComment(scope.data.comments[i]);
	}

	currentComments = scope.data.comments;
	currentPageType = "POST";

	if (location.hash.indexOf("new") != -1) 
		_g('composer_'+scope.data.id).focus();

	if (location.hash.indexOf("repost") != -1) 
		repost(scope.data.id);

	renderTags(scope.data);
}

