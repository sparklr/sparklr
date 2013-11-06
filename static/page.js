//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox", "notifications", "explore", "staff"];

var staticPages = { "notifications":1 };

var previousPage = "";

var homepage = function(posts) {
	if (location.href.indexOf("/welcome") != -1 && location.hash == "") {
		location.href = "/#/welcome";
		return;
	}

	subscribedStream = 0;

	var args = location.hash.split("/");
	var prehtml = "";
	var composertext = "";
	if (args[1] == "welcome") {
		prehtml = "<input type='button' value='Next' onClick='location.href=\"/#/user/"+curUser+"/step2\";' style='margin:7px 4px;float:right'><h2 style='color:#fff'>Welcome to Sparklr! Say hello!</h2>"
		prehtml += "<div class='bubbleout'><div class='bubble leftb' style='margin-top:-60px;'>Why don't you take a moment to introduce yourself so that the other users can get to know you~</div></div>"
		prehtml += "<div class='bubbleout'><div class='bubble leftb' style='margin-top: 72px;'>This is the Dash, where everyone sees everything. It may take a bit to get used to, but it makes it easier to meet other users. c:</div></div>";
		prehtml += "<div class='bubbleout'><div class='bubble rightb' style='margin-top: 40px;'>These buttons allow you to filter what you see on the dash. When you follow a Network, a tab will appear here as well.</div></div>";
		composertext = "#introducing ";
	}
	if (args[1] == "mention") {
		composertext = "@" + args[2] + " ";
	}

	if (args[1] && args[1] != "" && args[1] != "welcome" && args[1] != "mention") {
		subscribedStream = args[1];
		isNetwork = true;
		lastUpdateTime = 0;
		prehtml = "<div id='networkheader'></div>";
		if (subscribedStream != "following") {
			ajaxGet("work/networkinfo/" + subscribedStream, null, function(data) {
				var html = "";
				var title = (data && data[0]) ? data[0].title : subscribedStream;
				html += "<input id='trackbtn' type='button' style='float:right'>";
				html += "<h2 style='color:#fff'>" + title + "</h2>";
				_g("networkheader").innerHTML = html;
				updateTrackNetwork();
			});
		}
	}
	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "active";
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

	isNetwork = false;

	//set timeline position
	if (subscribedStream == 0 && currentPageType == "STREAM")
		timelineTop = document.body.scrollTop || document.documentElement.scrollTop;

	//Dismiss notifications
	handleNotifications();

	hideAllPopups();

	//Page reload, thus scroll height has changed
	scrollHandler();

	//fix height
	_g("frame").style.minHeight = "640px";

	//disable bg
	if (!MOBILE)
		updateBackground(curUser, curBackground);

	//hide dropdown 
	hideDropdown();

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

	//page not found, go home
	//reset sidebar
	_g("sidebar").innerHTML = "";
	homepage();

}

