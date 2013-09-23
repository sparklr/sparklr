// p18 main app 
// Events, handlers, etc.

// Poll server for new data 
setInterval("pollData();", 1500);

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
var curBackground;
var isMod;

var app = function(payload) { 
	DISPLAYNAMES = payload.displayNames;
	USERHANDLES = payload.userHandles;
	IS_PRIVATE = payload.private;
	AVATAR_IDS[curUser] = payload.avatarid;
	HIDDEN_USERS = payload.blacklist;
	joinedNetworks = payload.networks;
	curBackground = payload.background;
	isMod = payload.isMod;

	addTimelineArray(payload.timelineStream, 0);

	for (var i = 0; i < joinedNetworks.length; i++) {
		addNetwork(joinedNetworks[i]);
	}

}

var s = document.cookie.match(/D\=([^\s|^\;]+)\;?/)[1].split(",");
curUser = s[0];
AUTHKEY = s[1];

eval(getTemplate("frontend"));
document.write(html);

var ua = navigator.userAgent;
var width = 480;
var scale = 1.0;

if (ua.match(/mobile/i)) {
	if (navigator.standalone || ua.match(/safari/i)) {
		width = 400;
		scale = 0.8;
	}
	if (ua.match(/chrome/i)) {
		width = 440;
		scale = 0.8;
	}
}
document.head.children[1].content = "target-densitydpi=device-dpi, width=" + width + ", initial-scale=" + scale + ", maximum-scale=" + scale + ", user-scalable=0";

// Nasty UA matching 
if (ua.match(/MSIE/i)) {
	var ver = ua.match(/MSIE ([\d.]+)/)[1];
	if (ver < 10) {
		eval(getTemplate("browsercompat"));
		showPopup(html);
	}
}
