//TODO: needs some serious refactoring
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
	
	var action = null;
	var body; 
	
	switch (parseInt(notification.type)) {
		case 1: //commented on post 
			body = "commented:<br>" + notification.body + "<br><br>";
			
			action = function() { location.href= "#/post/" + notification.action + "/new"; }
		break;
		case 2: //mentioned
			body = "mentioned you.<br><br>";
			action = function() { location.href = "#/post/" + notification.action; }
		break;
		case 4: //wrote on board 
			body = "posted on your board:<br>" + notification.body + "<br><br>";
			action = function() { location.href = "#/user/" + curUser + "/board"; }
		break;
		case 6: // repost
			body = "reposted your post.<br><br>";
			action = function() { location.href = "#/post/" + notification.action; }
		break;
		case 3: //chat
			setUserAttention(notification.from, true);
			newMessageFrom = getDisplayName(notification.from);
			updatePageTitle();
			return;
		break;
	}
	
	notification.body = "<img class='avatar' src='" + getAvatar(notification.from) + "'>" + getDisplayName(notification.from) + " " + body;

	var n = document.createElement("div");
	
	n.id = "notification_" + notification.id;
	n.innerHTML = "<span class='exit' onClick='dismissNotification(\"" + notification.id + "\");stopBubbling();'>x</span>" + notification.body;
	n.className = "fadein";
	n.onclick = action;

	//TODO: notifications may not work in IE
	_g("notificationlist").insertBefore(n, _g("notificationlist").children[0]);
	
	notificationCount++;
	updatePageTitle();
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
	setTimeout(function() { document.body.removeChild(_g(id)); }, 1000);
}

