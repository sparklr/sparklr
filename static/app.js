// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 1000);
setInterval("updateOnlineFriends();", 20000);

// Event handlers 
window.addEventListener("hashchange", function() { updatePages() });
window.addEventListener("load", function() { updatePages(true) });

var newPageToFetch = false;

var scrollHandler = function() {
	var doctop = document.body.scrollTop || document.documentElement.scrollTop;
	if (scrollDistanceFromBottom() < 600) {
		if (newPageToFetch) {
			console.log("Fetching posts");
			fetchOlderPosts();
			newPageToFetch = false;
		}
	} else {
		newPageToFetch = true;
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

var MOBILE = navigator.userAgent.match(/mobile/i) ? true : false;
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

var s = document.cookie.match(/D\=([^\s|^\;]+)\;?/)[1].split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate("frontend"));
document.write(html);

var ua = navigator.userAgent;

if (ua.match(/Chrome/i) && ua.match(/mobile/i)) {
	document.head.children[1].content = "target-densitydpi=device-dpi, width=440, initial-scale=0.8, maximum-scale=0.8, user-scalable=0";
} else {
	document.head.children[1].content = "target-densitydpi=device-dpi, width=480, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
}

// Nasty UA matching 
if (ua.match(/MSIE/i)) {
	var ver = ua.match(/MSIE ([\d.]+)/)[1];
	if (ver < 10) {
		eval(getTemplate("browsercompat"));
		showPopup(html);
	}
}
