var lastNotificationTime = 0;
var currentNotifications = [];
var notificationCount = 0;
var newMessageFrom = "";

var N_REPOST = 6;
var N_BOARD = 4;
var N_CHAT = 3;
var N_MENTION = 2;
var N_EVENT = 1;

var EMAIL_NOT_VERIFIED = "Pst: Your email address is unverified. <a href='#/settings/resend'>Resend verification</a>";

function addNotification(notification) {
	currentNotifications[notification.id] = notification;

	handleNotifications();

	if (parseInt(notification.time) > lastNotificationTime)
		lastNotificationTime = parseInt(notification.time);

	if (currentNotifications[notification.id] == null)
		return;

	notification = getNotificationBody(notification);
	notification.body = "<img class='avatar' src='" + getAvatar(notification.from) + "'>" + getDisplayName(notification.from) + " " + notification.body;

	var n = document.createElement("div");

	n.id = "notification_" + notification.id;
	n.innerHTML = "<span class='exit' onClick='dismissNotification(\"" + notification.id + "\");stopBubbling();'>x</span>" + notification.body;
	n.className = "fadein";
	n.onclick = function () { location.href = notification.click; };

	//TODO: notifications may not work in IE
	var parent = _g("notificationlist");
	if (parent.children.length < 1)
		parent.appendChild(n);
	else
		parent.insertBefore(n, parent.children[0]);

	notificationCount++;
	_g("notificationdot").innerHTML = notificationCount;
	_g("notificationdot").style.display = "block";
	updatePageTitle();
}

function getNotificationBody(notification) {
	var body = "";
	switch (parseInt(notification.type)) {
		case 1: //commented on post 
			if  (notification.body == LIKE_CHAR) 
				body = "likes your post.";
			else
				body = "commented:<br>" + notification.body;

			action = "/#/post/" + notification.action + "/new"; 
		break;
		case 2: //mentioned
			body = "mentioned you.";
			action = "/#/post/" + notification.action; 
		break;
		case 6: // repost
			body = "reposted your post.";
			action = "/#/post/" + notification.action; 
		break;
		case 3: //chat
			setUserAttention(notification.from, true);
			newMessageFrom = getDisplayName(notification.from);
			updatePageTitle();
			body = "messaged you.";
			action = "/#/chat/" + notification.from;
			setNewInbox(true);
		break;
		case 7: //whitelist
			body = "wants to be whitelisted.";
			action = "/#/user/" + notification.from;
		break;
	}

	body = body.replace(/\[IMG([A-Za-z0-9\._-]+)\]/g,"");
	notification.body = body;
	notification.click = action;
	
	return notification;
}

function showNotifications() {
	var l = 0;
	var n;
	for (i in currentNotifications) {
		l++;
		n = currentNotifications[i];
	}
	if (l < 2) {
		n = getNotificationBody(n);
		location.href=n.click;
	} else {
		location.href="/#/notifications";
	}
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
	if (notificationCount == 0)
		_g("notificationdot").style.display = "none";
	_g("notificationdot").innerHTML = notificationCount;
	updatePageTitle();
}

function handleNotifications() {
	if (!pageActive) return;

	for (id in currentNotifications) {
		if (!currentNotifications[id]) continue;
		var s = location.hash.split("/");

		if (s[1] == "post" && s[2] == currentNotifications[id].action && [N_EVENT, N_MENTION, N_REPOST].indexOf(parseInt(currentNotifications[id].type)) != -1) {
			dismissNotification(id);
			continue;
		}
		if (s[1] == "user" && s[2] == curUser && currentNotifications[id].type == N_BOARD) {
			dismissNotification(id);
			continue;
		}
		if (currentNotifications[id].type == N_CHAT) {
			if (s[1] == "chat" && s[2] == currentNotifications[id].from) {
				setUserAttention(currentNotifications[id].from, false);
				newMessageFrom = "";
				dismissNotification(id);				
				setNewInbox(false);
			}
		}

	}
}

function dismissNotification(id) {
	ajaxGet("work/delete/notification/" + id);
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

