function before(scope) {
	DISPLAYNAMES[scope.data.user] = scope.data.name;
	USERHANDLES[scope.data.user] = scope.data.handle;
	AVATAR_IDS[scope.data.user] = scope.data.avatarid;

	scope.pageType = scope.fragments[2];
}

function after(scope) {
	var arr = scope.data.timeline;

	missingPostsList = [];

	for(var i = arr.length-1; i >= 0; i--) {
		addTimelineEvent(arr[i]);
	}

	addTimelineArray(arr,subscribedStream);
	updateHeader(scope.data.user,scope.data.avatarid); 

	subscribedStream = scope.data.user;
	_g("content").style.minHeight = 0;

	currentPageType = "STREAM";

	if (scope.pageType == "photos")
		currentPageType = "PHOTO";
	if (scope.pageType == "mentions")
		currentPageType = "MENTIONS";
	if (scope.pageType == "step2")
		editProfile(); 
}

