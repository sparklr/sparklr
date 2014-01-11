/* Sparklr
 * App entry point
 * Set up events and launch the app from initial server payload
 */

// Poll server for new data every X ms
setInterval("pollData();", POLL_INTERVAL);

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
}
window.addEventListener("scroll", scrollHandler);

// Render/process data sent from the server (initial payload)
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

	setInterval(handleNotifications,1000);
}

var s = document.cookie.match(/D\=([^\s|^\;]+)\;?/)[1].split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate(((MOBILE) ? "mobilefrontend" : "frontend")));
document.write(html);

if (!(MOBILE)) {
	// Nasty UA matching 
	if (navigator.userAgent.match(/MSIE/i)) {
		var ver = ua.match(/MSIE ([\d.]+)/)[1];
		if (ver < 10) {
			eval(getTemplate("browsercompat"));
			showPopup(html);
		}
	}
}

