var lastNotificationTime = 0;
var currentNotifications = [];
var notificationCount = 0;

var N_REPOST = 6;
var N_CHAT = 3;
var N_MENTION = 2;
var N_EVENT = 1;

function addNotification(notification) {
	if (currentNotifications[notification.id]) return; //duplicate
	currentNotifications[notification.id] = notification;

	if (!MOBILE)
		handleNotifications();

	if (parseInt(notification.time) > lastNotificationTime)
		lastNotificationTime = parseInt(notification.time);

	if (currentNotifications[notification.id] == null)
		return;

	notification = getNotificationBody(notification);

	var n = document.createElement("div");

	n.id = "notification_" + notification.id;
	n.innerHTML = "<span class='exit' onClick='dismissNotification(\"" + notification.id + "\");stopBubbling();'>x</span><img class='littleavatar' src='" + getAvatar(notification.from) + "'><b>" + getDisplayName(notification.from) + "</b> " + notification.body;
	n.className = "fadein";
	n.onclick = function () { location.href = notification.click; };

	var parent = _g("notificationlist");
	if (parent.children.length < 1)
		parent.appendChild(n);
	else
		parent.insertBefore(n, parent.children[0]);

	notificationCount++;

	if (notification.type != N_CHAT)
		_g("notifs").className = "notifs jiggle";

	updatePageTitle();
	if(_g("notifications")){
		addNotificationToPage(notification);
	}
}

function addNotificationToPage(notification){
	if(!notification.click){
		notification = getNotificationBody(notification);
	}
	var n = document.createElement("div");
	
	n.style.position = "relative";
	n.style.cursor = "pointer";
	n.style.minHeight = "60px";
	n.onclick = function () { location.href = notification.href };
	n.innerHTML = "<div class='rightcontrols'><div class='time' data-time='" + notification.time + "'></div></div><img src='" + getAvatar(notification.from) +"' class='avatar'><b>"+ getDisplayName(notification.from) + "</b> " + notification.body + "<br><br>";

	var parent = _g("notifications");
	if (parent.children.length < 1)
		parent.appendChild(n);
	else
		parent.insertBefore(n, parent.children[0]);
	_g("hailjeiluh").style.display = "none";
}

function getNotificationBody(notification) {
	var body = "";
	switch (parseInt(notification.type)) {
		case 1: //commented on post 
			if (notification.body == LIKE_CHAR) 
				body = "likes your post.";
			else
				body = "commented:<br>" + notification.body;

			action = "javascript:showEvent('" + notification.action + "')"; 
		break;
		case 2: //mentioned
			body = "mentioned you.";
			action = "javascript:showEvent('" + notification.action + "')"; 
		break;
		break;
		case 6: // repost
			body = "reposted your post.";
			action = "javascript:showEvent('" + notification.action + "')"; 
		break;
		case 3: //chat
			setUserAttention(notification.from, true);
			updatePageTitle();
			body = "says: " + notification.body;
			action = "javascript:chatWith('" + notification.from + "')"; 
			setNewInbox(true);
		break;
	}

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
		for (i in activeWindows) {
			if (activeWindows[i] == "c" + currentNotifications[id].action) {
				var g = _g("window_"+activeWindows[i]);
				if (g.scrollHeight - g.scrollTop < 500) {
					dismissNotification(id);
					continue notificationLoop;
				}
			}
			if (currentNotifications[id].type == N_CHAT && activeWindows[i] == "m" + currentNotifications[id].from + "," + curUser) {
				// TODO: abstract
				var g = _g("window_"+activeWindows[i]);
				if (g.scrollHeight - g.scrollTop < 500) {
					setUserAttention(currentNotifications[id].from, false);
					dismissNotification(id);				
					setNewInbox(false);
					continue notificationLoop;
				}
			}
		}
		if (currentNotifications[id].type == N_CHAT) {
			if (s[1] == "chat" && s[2] == currentNotifications[id].from) {
				setUserAttention(currentNotifications[id].from, false);
				dismissNotification(id);				
				setNewInbox(false);
			}
		}
	}
}

if (!MOBILE)
	setInterval(handleNotifications,1000);

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

