// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 1000);
setInterval("updateOnlineFriends();", 20000);

// Event handlers 
window.addEventListener("hashchange", function() { updatePages() });
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

var AUTHKEY;
var curUser;

var app = function(payload) { 
	FRIENDS = payload.friends;
	DISPLAYNAMES = payload.displayNames;
	USERHANDLES = payload.userHandles;

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
var s = document.cookie.substring(2).split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate("frontend"));
document.write(html);
