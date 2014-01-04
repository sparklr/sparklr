//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox", "notifications", "explore", "staff"];

var staticPages = { "notifications":1 };

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

var homepage = function(posts) {
	if (location.href.indexOf("/welcome") != -1 && location.hash == "") {
		location.href = "/#/welcome";
		return;
	}

	defaultSidebar();

	subscribedStream = 0;

	var args = location.hash.split("/");
	var prehtml = "";
	var composertext = "";

	if (args[1] && args[1] != "" && args[1] != "welcome") {
		subscribedStream = args[1];
		isNetwork = true;
		lastUpdateTime = 0;
	}
	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "network active";
	}

	renderTimeline(prehtml);
	ajaxGet("work/stream/" + subscribedStream, null, function(data) {
		timelineEvents[subscribedStream] = [];
		for (var i = 0; i < data.length; i++) {
			addTimelineEvent(data[i],true);
		}
	});

	if (composertext) {
		var composer = _g("composer_composer");
		composer.value = composertext;
		composer.focus();
		composer.selectionStart = composer.value.length;
	}

	window.scrollTo(0,timelineTop);
	pollData();
	subscribeToStream(subscribedStream);

	if (localStorage)
		localStorage.setItem("lastnetwork", subscribedStream);
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

	unsubscribeFromStream(subscribedStream);

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "";
	}

	missingPosts = 0;
	oldestPost = Number.MAX_VALUE;

	isNetwork = false;

	//set timeline position
	if (subscribedStream == 0 && currentPageType == "STREAM")
		timelineTop = document.body.scrollTop || document.documentElement.scrollTop;

	//Dismiss notifications
	handleNotifications();

	hideAllPopups();

	//Page reload, thus scroll height has changed
	scrollHandler();

	if (typeof(hideDropdown) !== 'undefined')
		hideDropdown();

	//fix height
	//_g("frame").style.minHeight = "640px";

	//disable bg
	updateBackground(curUser, curBackground);

	var s = location.hash.split("/");

	previousPage = s;	
	if (s[1] === "post") {
		subscribedStream = s[2];
		subscribeToStream(s[2]);
	}

	for (i = 0; i < definedPages.length; i++) {
		if (definedPages[i] == s[1]) {
				renderPageFromTemplate();
			return true;
		}
	}

	if (s[0] == "") {
		changeLocation();
		return;
	}
	//page not found, go home
	//reset sidebar
	_g("sidebar").innerHTML = "";
	homepage();

}

function changeLocation(){
		if (localStorage && (n = localStorage.getItem("lastnetwork")))
			location.href = '/#/' + n;
		else
			location.href = '/#/everything';
}

