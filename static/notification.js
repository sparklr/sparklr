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

	handleNotifications();

	if (parseInt(notification.time) > lastNotificationTime)
		lastNotificationTime = parseInt(notification.time);
	
	// if handleNotifications removed it, stop adding it
	if (currentNotifications[notification.id] == null)
		return;

	notification = processNotification(notification);

	if (!(MOBILE)) {
		eval(getTemplate("notification"));

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
		_g("notifs").className = "notifs jiggle";

	updatePageTitle();

	if (_g("notifications"))
		addNotificationToPage(notification);
}

function addNotificationToPage(notification){
	if(!notification.click){
		notification = getNotificationBody(notification);
	}

	var n = document.createElement("div");
	n.onclick = function () { location.href = notification.click };
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
				body = "likes your post.";
			else
				body = "commented:<br>" + notification.body;
		break;
		case N_MENTION: //mentioned
			body = "mentioned you.";
		break;
		case N_REPOST: // repost
			body = "reposted your post.";
		break;
		case N_CHAT: //chat
			addChatMessage(notification.from, CURUSER, notification.body, notification.time, false);
			updatePageTitle();
			body = "says: <br>" + notification.body;
			setNewInbox(true);
		break;
	}

	if (N_CHAT)
		action = function() { chatWith(notification.from); }
	else
		action = function() { showPost(notification.action); }


	body = processMedia(body);
	notification.body = body;
	notification.click = action;
	
	return notification;
}

function removeNotification(id) {
	currentNotifications[id] = null;

	var e = _g("notification_" + id);

	if (e) {
		e.className = "flyout";
		setTimeout(function() {
			_g("notificationlist").removeChild(_g("notification_" + id));
		}, 510);
	}

	if (notificationCount > 0)
		notificationCount--;

	_g("notifs").className = "notifs";
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
			if (s[1] == "chat" && +s[2] == currentNotifications[id].from) {
				dismissNotification(id);				
				setNewInbox(false);
			}
		}
	}
}

function dismissNotification(id) {
	ajax("work/delete/notification/" + id);
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

