CONTROLLERS['tag'] = {};
CONTROLLERS['tag'].after = function(data, fragments) {
	subscribedStream = fragments[1];
	currentPageType = "TAG";
	var arr = data;

	addTimelineItems(arr);
}
