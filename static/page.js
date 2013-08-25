//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox"];

var staticPages = {  };

var previousPage = "";

var homepage = function() {
	if (location.href.indexOf("/welcome") != -1 && location.hash == "") {
		location.href = "/#/welcome";
		return;
	}
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

	renderTimeline(prehtml);
	subscribedStream = 0;

	if (args[1] == "network") {
		subscribedStream = parseInt(args[2]);
		isNetwork = true;
		lastUpdateTime = 0;
	}

	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		addTimelineEvent(timelineEvents[subscribedStream][i]);
	}

	if (composertext) {
		var composer = _g("composer");
		composer.value = composertext;
		composer.focus();
		composer.selectionStart = composer.value.length;
	}
	window.scrollTo(0,timelineTop);
	dummySidebar();
}

function dummySidebar() {
	var html = "";
	if (!MOBILE) {
		html += "<div class='unimportant'>";
		html += "<a href='/#/user/" + curUser + "'>" + getDisplayName(curUser) + "</a>";
		html += "<a href='/#/photos/'>Photos</a>";
		html += "<a href='/#/invite/'>Invite friends</a>";
		html += "<a href='javascript:meetSomeoneRandom();'>Meet someone random</a>";
		html += "</div>";
	}
	_g("sidebar").innerHTML = html;
}

function updatePages(loaded) {
	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }

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

