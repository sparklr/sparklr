// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 5000);

// Event handlers 
window.addEventListener("hashchange", function() { updatePages() });
window.addEventListener("load", function() { updatePages(true) });
window.addEventListener("blur", function() {
	pageActive = false;
});
window.addEventListener("focus", function() {
	pageActive = true;
	handleNotifications();
});

var newPageToFetch = false;
var doctop = 0;

var scrollHandler = function() {
	doctop = document.body.scrollTop || document.documentElement.scrollTop;
	if (scrollDistanceFromBottom() < 600) {
		if (newPageToFetch) {
			console.log("Fetching posts");
			fetchOlderPosts();
			newPageToFetch = false;
		}
	} else {
		newPageToFetch = true;
	}
}
window.addEventListener("scroll", scrollHandler);

var AUTHKEY;
var curUser;
var curBackground;
var isMod;

var app = function(payload) { 
	DISPLAYNAMES = payload.displayNames;
	USERHANDLES = payload.userHandles;
	AVATAR_IDS[curUser] = payload.avatarid;
	HIDDEN_USERS = payload.blacklist;
	joinedNetworks = payload.networks;
	curBackground = payload.background;
	isMod = payload.isMod;

	for (var i = 0; i < payload.following.length; i++) {
		subscribeToStream(payload.following[i]);
	}
	subscribeToStream(curUser);

	addTimelineArray(payload.timelineStream, 0);

	for (var i = 0; i < payload.notifications.length; i++) {
		addNotification(payload.notifications[i]);
	}
}

var s = document.cookie.match(/D\=([^\s|^\;]+)\;?/)[1].split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate("frontend"));
document.write(html);

