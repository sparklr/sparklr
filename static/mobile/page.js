var menuVisible = false;

function _g(id) {
	return document.getElementById(id);
}

function renderPage() {
}
function showMenu() {
    if (menuVisible) {
        return hideMenu();
    }
    
	setTimeout('_g("menu").style.opacity = 1;', 1);
    _g("menu").style.display = "block";
	menuVisible = true;
    stopBubbling();
}
function hideMenu() {
    setTimeout('_g("menu").style.display = "none";', 200);
	_g("menu").style.opacity = 0;
	menuVisible = false;
    stopBubbling();
}

window.onclick = function() {
	if (menuVisible) {
		hideMenu();
	}
}


//Page system
window.addEventListener("hashchange", updatePages);
window.addEventListener("load", function() { updatePages(true) });

function updatePages(loaded) {
	//Dismiss notifications
	handleNotifications();

	var s = location.hash.split("/");

	for (i = 0; i < definedPages.length; i++) {
		if (definedPages[i] == s[1]) {
		    console.log(definedPages[i]);
			ajaxGet("pages/" + definedPages[i] + ".php" + ((s.length > 2) ? ("?args=" + location.hash.substring(1)) : ""));
			return true;
		}
	}

	//page not found, go home
	if (typeof(loaded) != "undefined") {
		homepage();
	}

}

var definedPages = ["me", "post", "user", "settings", "friends", "nearby", "chat", "invite", "search", "photos"];

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
}

var ERROR_ACCESS_DENIED = "Sorry, not mutal blahba";
