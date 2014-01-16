function after(scope) {
	subscribedStream = scope.fragments[1];
	currentPageType = "TAG";
	var arr = scope.data;

	for(var i = arr.length-1; i >= 0; i--) {
		addTimelineEvent(arr[i]);
	}

	addTimelineArray(arr,subscribedStream);
	updateTrackTagBtns(subscribedStream);
}
