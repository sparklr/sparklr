// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 1000);
setInterval("updateOnlineFriends();", 20000);

// Event handlers 
window.addEventListener("hashchange", updatePages);
window.addEventListener("load", function() { updatePages(true) });

window.addEventListener("scroll", function() {
	if (scrollDistanceFromBottom() < 600) {
		fetchOlderPosts();
	}
});

window.addEventListener("blur", function() {
	pageActive = false;
});

window.addEventListener("focus", function() {
	pageActive = true;
	handleNotifications();
});

// Render/process data sent from the server (initial payload)

var app = function(payload) { 
	updateFriendsList();

	for (var i = 0; i < payload.timelineStream.length; i++) {
		for (var n = 0; n < payload.commentCounts.length; n++) { 
			if (payload.timelineStream[i].id == payload.commentCounts[n].postid) {
				payload.timelineStream[i].commentcount = payload.commentCounts[n]["COUNT(`postid`)"];
			}
		}
	}

	addTimelineArray(payload.timelineStream, 0);
}
				

