CONTROLLERS['post'] = {
	"before": function (data, fragments) {
		data = processPostMeta(data);
	},

	"after": function (data, fragments) {
		for (var i = 0; i < data.comments.length; i++) {
			renderComment(data.comments[i]);
		}

		currentComments = data.comments;

		if (location.hash.indexOf("new") != -1) 
			_g('composer_'+data.id).focus();

		if (location.hash.indexOf("repost") != -1) 
			repost(data.id);

		renderTags(data);
	}
};

