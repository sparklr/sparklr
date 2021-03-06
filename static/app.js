/* Sparklr
 * App entry point
 * Set up events and launch the app from initial server payload
 */

// Global app variables
var CURUSER, AUTHKEY, ISMOD, GUEST;

// Poll server for new data every X ms
setInterval("pollData();", POLL_INTERVAL);

// Event handlers 
window.addEventListener("hashchange", function() { updatePages() });
window.addEventListener("load", function() { updatePages(true) });
window.addEventListener("scroll", scrollHandler);
window.addEventListener("blur", function() { pageActive = false; });
window.addEventListener("focus", function() { pageActive = true; handleNotifications(); });

// Called by script tags output by the server for initial payload
function app(payload) { 
	CURUSER = payload.user;
	AUTHKEY = payload.authkey;
	ISMOD = payload.isMod;

	DISPLAYNAMES = payload.displayNames;
	USERHANDLES = payload.userHandles;
	AVATAR_IDS[CURUSER] = payload.avatarid;
	HIDDEN_USERS = payload.blacklist;
	GUEST = payload.guest;

	// Read the appropriate frontend template and evaluate it to populate
	// the html variable, which is written to the page body
	var html = getTemplate(((MOBILE) ? "mobilefrontend" : "frontend"))();
	document.write(html);

	for (var i = 0; i < payload.notifications.length; i++) {
		addNotification(payload.notifications[i]);
	}

	setInterval(handleNotifications,1500);
	
	if (spc = _g("sidepost_container")) {
		var h = function(e) {
			if (~~subscribedStream !== subscribedStream || doctop > 300)
				preventDefaultScroll(e);
		}
		spc.addEventListener("DOMMouseScroll", h);
		spc.addEventListener("mousewheel", h);
	}

	setWelcomeBar();

	// Warn if using an old version of IE
	if (!(MOBILE)) {
		document.addEventListener("click", hideFader);

		// Nasty UA matching 
		if (navigator.userAgent.match(/MSIE/i)) {
			var ver = ua.match(/MSIE ([\d.]+)/)[1];
			if (ver < 10) {
				eval(getTemplate("browsercompat"));
				showPopup(html);
			}
		}
	}
}

