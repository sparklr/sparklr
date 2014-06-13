/* Sparklr
 * Page navigation, hashchange, streams, etc
 */

// The current page type, i.e. stream, chat
var currentPageType;

// Pages the server allows us to navigate to
var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox", "notifications", "explore", "staff"];

// The sidebar networks we define
var networks = {
	"following": "Following",
	"popular": "Popular",
	"everything": "Everything",
	"music": "Music",
	"funny": "Funny",
	"tech": "Tech",
	"gaming": "Gaming",
	"art": "Art",
	"misc": "Misc",
};

var previousPage = "";

var suppressHashChange = false;

function showStreamPage(posts) {
	defaultSidebar();

	missingPostsList = [];

	subscribedStream = "";

	oldestPost = Number.MAX_VALUE;

	var args = location.hash.split("/");

	if (args[1] && args[1] != "") {
		subscribedStream = args[1];
		isNetwork = true;
	}

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "network active";
	}

	oldestPost = Number.MAX_VALUE;
	lastModified = 0;
	sinceID = 0;

	renderTimeline();

	ajax("stream/" + subscribedStream, null, function(data) {
		addTimelineItems(data);

		if (c = _g("cssloader"))
			c.style.display = "none";
	});

}

function defaultSidebar() {
	var links = '';
	for (id in networks) {
		links += "<a href='#/"+id+"' id='network_" + id + "'>" + networks[id] + "</a>"
	}

	_g('sidebar').innerHTML = links;
}

function updatePages(loaded) {
	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }
	window.onload = null;

	if (suppressHashChange)
		return suppressHashChange = false;

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "";
	}

	subSubscribedStream = 0;
	subPageType = "";

	isNetwork = false;

	//Dismiss notifications
	handleNotifications();

	hideAllPopups();
	hideFader();

	//Page reload, thus scroll height has changed
	scrollHandler();

	if (typeof(hideDropdown) !== 'undefined')
		hideDropdown();

	var s = location.hash.split("/");

	if (s[1] === "post") {
		if (subscribedStream && (definedPages.indexOf(previousPage[1]) == -1 || previousPage[1] == 'user') && _g("sidepost_container") && showSidepost(s[2])) {
			subSubscribedStream = s[2];
			subPageType = "POST";
			return;
		} else {
			subscribedStream = s[2];
			currentPageType = "POST";
		}
	}
	previousPage = s;	

	for (i = 0; i < definedPages.length; i++) {
		if (definedPages[i] == s[1]) {
				renderPageFromTemplate();
			return true;
		}
	}

	if (s[0] == "" || !s[1]) {
		changeLocation();
		return;
	}
	//page not found, go home
	//reset sidebar
	_g("sidebar").innerHTML = "";
	showStreamPage();

}

function changeLocation(){
	location.href = '/#/following';
}

