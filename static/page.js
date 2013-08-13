//The current page type, i.e. stream, chat
var currentPageType;

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos", "tag", "repost", "welcome"];

var homepage = function() {
	var args = location.hash.split("/");
	var prehtml = "";
	var composertext = "";
	if (args[1] == "step3") {
		prehtml = "<input type='button' value='Next' onClick='location.href=\"/#/friends/step4\";' style='margin:7px 4px;float:right'><h2 style='color:#fff'>Step 3: Say hello!</h2>";
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
}

function updatePages(loaded) {
	document.body.ondrop = document.body.ondragover = document.body.ondragenter = function (e) { dropPrevent(e); }
	
	//set timeline position
	if (subscribedStream == 0 && currentPageType == "STREAM")
		timelineTop = document.body.scrollTop || document.documentElement.scrollTop;

	//Dismiss notifications
	handleNotifications();

	//Page reload, thus scroll height has changed
	scrollHandler();

	//fix height
	_g("frame").style.minHeight = "640px";

	//disable bg
	hideBackground();

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

