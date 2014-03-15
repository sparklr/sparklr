CONTROLLERS['tag'] = {};
CONTROLLERS['tag'].after = function(data, fragments) {
	subscribedStream = fragments[1];
	currentPageType = "TAG";
	var arr = data;

	for(var i = arr.length-1; i >= 0; i--) {
		addTimelineEvent(arr[i]);
	}

	addTimelineArray(arr,subscribedStream);
}
