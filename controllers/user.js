CONTROLLERS['user'] = {};
CONTROLLERS['user'].before = function(data, fragments) {
	DISPLAYNAMES[data.user] = data.name;
	USERHANDLES[data.user] = data.handle;
	AVATAR_IDS[data.user] = data.avatarid;

	pageType = fragments[2];
}

CONTROLLERS['user'].after = function(data, fragments) {
	var arr = data.timeline;

	missingPostsList = [];
	console.log(arr);

	for(var i = 0; i < arr.length; i++) {
		addTimelineEvent(arr[i], true);
	}

	updateHeader(data.user,data.avatarid); 

	subscribedStream = data.user;
	_g("content").style.minHeight = 0;

	currentPageType = "STREAM";

	if (pageType == "photos")
		currentPageType = "PHOTO";
	if (pageType == "mentions")
		currentPageType = "MENTIONS";
	if (pageType == "step2")
		editProfile(); 
}

