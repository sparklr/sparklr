/* Sparklr
 * Notifications, handling of such.
 */

// Keeps track of the latest beacon time
var lastNotificationTime = 0;

// Store notifications and remove when dismissed
var currentNotifications = [];

// Keep an accurate count of the notifications, for title purposes
var notificationCount = 0;

// Notification types
var N_REPOST = 6;
var N_CHAT = 3;
var N_MENTION = 2;
var N_EVENT = 1;

function addNotification(notification) {
	if (currentNotifications[notification.id]) {
		return; //duplicate
	}

	currentNotifications[notification.id] = notification;

	notification = processNotification(notification);

	handleNotifications();

	if (parseInt(notification.time) > lastNotificationTime)
		lastNotificationTime = parseInt(notification.time);
	
	// if handleNotifications removed it, stop adding it
	if (currentNotifications[notification.id] == null)
		return;

	if (!(MOBILE)) {
		var html = getTemplate("notification")(notification);

		var n = document.createElement("div");
		n.id = "notification_" + notification.id;
		n.innerHTML = html;
		n.className = "fadein";
		n.onclick = notification.click;
	
		var parent = _g("notificationlist");
		if (parent.children.length < 1)
			parent.appendChild(n);
		else
			parent.insertBefore(n, parent.children[0]);
	}

	notificationCount++;

	if (notification.type != N_CHAT)
		_g("notifs").className = "icon-bubbles active jiggle";

	updatePageTitle();

	if (_g("notifications"))
		addNotificationToPage(notification);
}

function addNotificationToPage(notification){
	if(!notification.click){
		notification = processNotification(notification);
	}

	var n = document.createElement("div");
	n.onclick = notification.click;
	var html = getTemplate("notificationbody")(notification);
	n.innerHTML = html;
	
	var parent = _g("notifications");
	if (parent.children.length < 1)
		parent.appendChild(n);
	else
		parent.insertBefore(n, parent.children[0]);
	_g("hailjeiluh").style.display = "none";
}

function processNotification(notification) {
	var body = "";
	var action = "";
	notification.body = escapeHTML(notification.body);
	switch (parseInt(notification.type)) {
		case N_EVENT: //commented on post 
			if (notification.body == LIKE_CHAR) 
				body = " likes your post.";
			else
				body = " commented:<br>" + notification.body;
		break;
		case N_MENTION: //mentioned
			body = " mentioned you.";
		break;
		case N_REPOST: // repost
			body = " reposted your post.";
		break;
		case N_CHAT: //chat
			body = " says: <br>" + notification.body;
			if (!notification.read) {
				addChatMessage({ from: notification.from, to: CURUSER, message: notification.body, time: notification.time }, false);
				updatePageTitle();
				setNewInbox(true);
			}
		break;
	}

	if (notification.type == N_CHAT)
		action = function(e) { chatWith(notification.from); stopBubbling(e); }
	else
		action = function(e) { showPost(notification.action); stopBubbling(e); }


	body = processMedia(body);
	notification.body = body;
	notification.click = action;
	
	return notification;
}

function removeNotification(id) {
	currentNotifications[id] = null;

	var e = _g("notification_" + id);

	if (e) {
		_g("notificationlist").removeChild(_g("notification_" + id));
	}

	if (notificationCount > 0)
		notificationCount--;

	_g("notifs").className = "icon-bubbles";
	updatePageTitle();
}

function handleNotifications() {
	if (!pageActive) return;

	var s = location.hash.split("/");
	
	notificationLoop:
	for (id in currentNotifications) {
		if (!currentNotifications[id]) continue;

		if (s[1] == "post" && s[2] == currentNotifications[id].action) {
			dismissNotification(id);
			continue;
		}
		if (!(MOBILE)) {
			if (subPageType == "POST" && subSubscribedStream && subSubscribedStream == currentNotifications[id].action) {
				dismissNotification(id);				
				continue;
			}
			for (i in activeWindows) {
				if (activeWindows[i] == "m" + currentNotifications[id].from + "," + CURUSER) {
					var g = _g("window_"+activeWindows[i]);
					if (g.scrollHeight - g.scrollTop < 500) {
						dismissNotification(id);				
						setNewInbox(false);
						continue notificationLoop;
					}
				}
			}
		}
		if (currentNotifications[id].type == N_CHAT) {
			if (s[1] == "chat" && ~~s[2] == currentNotifications[id].from) {
				dismissNotification(id);				
				setNewInbox(false);
			}
		}
	}
}

function dismissNotification(id) {
	ajax("dismiss/" + id);
	removeNotification(id);
}

function showBanner(text, id, timeout) {
	if (_g(id) != null) return; //notification already exists

	var ele = document.createElement("div");

	ele.id = id;
	ele.innerHTML = text + "<a onClick='hideBanner(\""+id+"\");' id='dismiss'>X</a>";
	ele.className = "banner";

	document.body.appendChild(ele);

	if (typeof(timeout) != "undefined")
		setTimeout(function() { hideBanner(id); }, timeout);
}

function hideBanner(id) {
	if (!_g(id)) return;
	_g(id).style.opacity = 0;
	setTimeout(function() { if (_g(id)) document.body.removeChild(_g(id)); }, 1000);
}

