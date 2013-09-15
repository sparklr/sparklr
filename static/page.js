//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox", "notifications", "explore"];

var staticPages = { "notifications":1 };

var previousPage = "";

var homepage = function() {
	if (location.href.indexOf("/welcome") != -1 && location.hash == "") {
		location.href = "/#/welcome";
		return;
	}

	subscribedStream = 0;

	var args = location.hash.split("/");
	var prehtml = "";
	var composertext = "";
	if (args[1] == "welcome") {
		prehtml = "<input type='button' value='Next' onClick='location.href=\"/#/user/"+curUser+"/step2\";' style='margin:7px 4px;float:right'><h2 style='color:#fff'>Welcome to Sparklr! Say hello!</h2>";
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
	if (timelineEvents[subscribedStream]) {
		for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
			addTimelineEvent(timelineEvents[subscribedStream][i]);
		}
	}

	if (composertext) {
		var composer = _g("composer");
		composer.value = composertext;
		composer.focus();
		composer.selectionStart = composer.value.length;
	}
	window.scrollTo(0,timelineTop);
	dummySidebar();
	pollData();
}

function dummySidebar() {
	return;
	var html = "";
	if (!MOBILE) {
		html += "<div class='unimportant'>";
		html += "<a href='/#/'>The World</a>";
		html += "<a href='/#/following'>People I follow</a>";
		html += "<a href='/#/invite/'>Invite friends</a>";
		html += "<a href='javascript:meetSomeoneRandom();'>Meet someone random</a>";
		html += "</div>";
	}
	_g("sidebar").innerHTML = html;
}

function updatePages(loaded) {
	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }
	window.onload = null;

	var e = _g("network_" + subscribedStream);
	if (e) {
		e.className = "";
	}

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
	hideBackground();

	//hide dropdown 
	hideDropdown();

	var s = location.hash.split("/");

	if (s[1] == "user" && !isNaN(parseInt(s[2])) && !s[3] && previousPage[1] != "user") {
		if (USERHANDLES[parseInt(s[2])]) {
			location.href = "/#/user/" + USERHANDLES[parseInt(s[2])];
			return;
		}
	}

	previousPage = s;	

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

