CONTROLLERS['tag'] = {};
CONTROLLERS['tag'].after = function(data, fragments) {
	subscribedStream = fragments[1];
	currentPageType = "TAG";
	var arr = data;

	for(var i = 0; i < arr.length; i++) {
		addTimelineEvent(arr[i], true);
	}

	addTimelineArray(arr,subscribedStream);
}
