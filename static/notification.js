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

	var c = 0;
	for (n in currentNotifications) {
		if (currentNotifications[n].action == notification.action)
			c++;
	}
	if (c > 1) return;

	var action = null;
	var body; 

	switch (parseInt(notification.type)) {
		case 1: //commented on post 
			if  (notification.body == LIKE_CHAR) 
		body = "likes this post.";
		else
			body = "commented:<br>" + notification.body;

		action = function() { location.href= "#/post/" + notification.action + "/new"; }
		break;
		case 2: //mentioned
			body = "mentioned you.";
		action = function() { location.href = "#/post/" + notification.action; }
		break;
		case 6: // repost
			body = "reposted your post.";
		action = function() { location.href = "#/post/" + notification.action; }
		break;
		case 3: //chat
			setUserAttention(notification.from, true);
			newMessageFrom = getDisplayName(notification.from);
			updatePageTitle();
			body = "messaged you.";
			action = function() { chatWith(notification.from); }
			setNewInbox(true);
		break;
		case 7: //whitelist
			body = "wants to be whitelisted.";
		action = function() { location.href = "#/user/" + notification.from; }
		break;
	}

	body = body.replace(/\[IMG([A-Za-z0-9\._-]+)\]/g,"");

	notification.body = "<img class='avatar' src='" + getAvatar(notification.from) + "'>" + getDisplayName(notification.from) + " " + body;

	var n = document.createElement("div");

	n.id = "notification_" + notification.id;
	n.innerHTML = "<span class='exit' onClick='dismissNotification(\"" + notification.id + "\");stopBubbling();'>x</span>" + notification.body;
	n.className = "fadein";
	n.onclick = action;
	n.addEventListener("touchstart", notification_touchstart);
	n.addEventListener("touchmove", notification_touchmove);
	n.addEventListener("touchend", notification_touchend);

	//TODO: notifications may not work in IE
	var parent = _g("notificationlist");
	if (parent.children.length < 1)
		parent.appendChild(n);
	else
		parent.insertBefore(n, parent.children[0]);

	notificationCount++;
	updatePageTitle();
}

function notification_touchstart(evt) {
	evt.target.setAttribute("data-lastx", evt.changedTouches[0].clientX);
	evt.target.setAttribute("data-left", 0);
}

function notification_touchmove(evt) {
	evt.preventDefault();
	var cur = evt.changedTouches[0].clientX;
	var last = evt.target.getAttribute("data-lastx");
	var curLeft = parseInt(evt.target.getAttribute("data-left")) || 0;

	var delta = parseInt(last) - cur;
	curLeft -= delta;
	if (curLeft < 0) {
		curLeft = 0;
	}

	evt.target.style.left = curLeft + "px";
	evt.target.setAttribute("data-left", curLeft);
	evt.target.setAttribute("data-lastx", evt.changedTouches[0].clientX);
}

function notification_touchend(evt) {
	evt.preventDefault();
	var curLeft = parseInt(evt.target.getAttribute("data-left"));
	var accel = -1;
	if (curLeft > 50) {
		accel = 1;
	}
	if (curLeft < 10) {
		evt.target.onclick();
		return;
	}

	var vel = 0;

	var t = setInterval(function() {
		vel += accel;
		curLeft += vel;

		if (curLeft < 0) {
			clearInterval(t);
			curLeft = 0;
		}
		if (curLeft > 170) {
			clearInterval(t);
			var id = evt.target.id.replace("notification_", "");
			console.log(id);
			dismissNotification(id);
		}
		evt.target.style.left = curLeft + "px";
	}, 10);
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

