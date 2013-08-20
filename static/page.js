//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "inbox"];

var staticPages = {  };

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

	for (var i = 0; i < timelineEvents[0].length; i++) {
		addTimelineEvent(timelineEvents[0][i]);
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
	if (!MOBILE) {
		var html;
		html = "<a href='/#/user/" + curUser + "'>My profile</a>";
		html += "<a href='/#/invite/'>Invite friends</a>";
		html += "<a href='javascript:meetSomeoneRandom();'>Meet someone random</a>";
		_g("sidebar").innerHTML = html;
	}
}

function updatePages(loaded) {
	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }

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

	if (s[1] == "user" && !isNaN(parseInt(s[2])) && !s[3]) {
		if (USERHANDLES[parseInt(s[2])]) {
			location.href = "/#/user/" + USERHANDLES[parseInt(s[2])];
			return;
		}
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

