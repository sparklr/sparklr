/* Sparklr
 * Page navigation, hashchange, streams, etc
 */

// The current page type, i.e. stream, chat
var currentPageType;

// Pages the server allows us to navigate to
var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox", "notifications", "explore", "staff"];

// Do not load from server, just render template
var staticPages = { "notifications":1 };

// The sidebar networks we define
var networks = {
	"everything": "Everything",
	"following": "Following",
	"music": "Music",
	"funny": "Funny",
	"tech": "Tech",
	"gaming": "Gaming",
	"art": "Art",
	"misc": "Misc",
};

var previousPage = "";

function showStreamPage(posts) {
	defaultSidebar();

	subscribedStream = "";

	var args = location.hash.split("/");
	var prehtml = "";

	if (args[1] && args[1] != "") {
		subscribedStream = args[1];
		isNetwork = true;
	}

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "network active";
	}

	renderTimeline(prehtml);
	ajax("stream/" + subscribedStream, null, function(data) {
		timelineEvents[subscribedStream] = [];
		for (var i = 0; i < data.length; i++) {
			addTimelineEvent(data[i],true);
		}
	});

	pollData();

	if (window.localStorage)
		window.localStorage.setItem("lastnetwork", subscribedStream);
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

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "";
	}

	missingPosts = 0;
	oldestPost = Number.MAX_VALUE;

	isNetwork = false;

	//Dismiss notifications
	handleNotifications();

	hideAllPopups();

	//Page reload, thus scroll height has changed
	scrollHandler();

	if (typeof(hideDropdown) !== 'undefined')
		hideDropdown();

	var s = location.hash.split("/");

	previousPage = s;	
	if (s[1] === "post") {
		subscribedStream = s[2];
	}

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
	if (window.localStorage && (n = window.localStorage.getItem("lastnetwork")))
		location.href = '/#/' + n;
	else
		location.href = '/#/everything';
}

