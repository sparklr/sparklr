//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost"];

var PAGEHANDLERS = [];

var homepage = function() {
	renderTimeline();
	publicStream = true;
	subscribedStream = 0;

	for (var i = 0; i < timelineEvents[0].length; i++) {
		addTimelineEvent(timelineEvents[0][i]);
	}

	var args = location.hash.split("/");
	if (args[1] == "mention") {
		var composer = _g("composer");

		composer.value = "@" + args[2] + " ";
		composer.focus();
		composer.selectionStart = composer.value.length;
	}
	window.scrollTo(0,timelineTop);
}

// Error pages
var ERROR_ACCESS_DENIED = "<h2>Sorry</h2>You don't have permission to see that page.";
var ERROR_NOT_AVAILABLE = "<h2>Uh oh</h2>That page, person, or scarce resource is no longer available.<br>In fact, it's entirely possible that it never existed.";

function updatePages(loaded) {

	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }
	
	//set timeline position
	if (subscribedStream == 0 && currentPageType == "STREAM")
		timelineTop = document.body.scrollTop || document.documentElement.scrollTop;

	//Dismiss notifications
	handleNotifications();

	//fix height
	_g("frame").style.minHeight = "640px";

	var s = location.hash.split("/");

	if (s[1] == "user" && isNaN(parseInt(s[2]))) {
		getUserFromHandle(s[2], function(id) {
			location.href = "#/user/" + id;
		});
		return;
	}

	for (i = 0; i < definedPages.length; i++) {
		if (definedPages[i] == s[1]) {
				renderPageFromTemplate();
			return true;
		}
	}

	//page not found, go home
	//reset sidebar
	_g("sidebar").innerHTML = "";
	homepage();

}

