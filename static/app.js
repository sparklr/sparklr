// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 1000);
setInterval("updateOnlineFriends();", 20000);

// Event handlers 
window.addEventListener("hashchange", function() { updatePages() });
window.addEventListener("load", function() { updatePages(true) });

var scrollHandler = function() {
	var doctop = document.body.scrollTop || document.documentElement.scrollTop;
	if (scrollDistanceFromBottom() < 600) {
		fetchOlderPosts();
	}
	var a = _g("scrolltotop");
	if (!a) return; // sometimes this is null?? TODO, look into that
	if (doctop > 1000) {
		a.style.visibility = "visible";
        a.style.opacity = 1;
    }
    else {
        a.style.visibility = "hidden";
        a.style.opacity = 0;
    }

	if (location.hash.indexOf("/user") != -1) {
		var pb = _g("profilebackground");
		pb.style.position = (doctop < 80) ? "absolute" : "fixed";
		pb.style.top = (doctop < 80) ? "80px" : "0px";
	}
}

window.addEventListener("scroll", scrollHandler);

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
	IS_PRIVATE = payload.private;

	updateFriendsList();

	addTimelineArray(payload.timelineStream, 0);

	for (var i = 0; i < payload.trackedtags.length; i++) {
		addTrackedTag(payload.trackedtags[i]);
	}
}

var s = document.cookie;
s = s.substring(s.indexOf("D=") + 2).split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate("frontend"));
document.write(html);
