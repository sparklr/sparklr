var ajaxCooldown = [];
var pendingTimer = [];

function ajaxGet(url, data, callback) {
	if (ajaxCooldown[url]) {
		return; //already a pending request for that url
	}

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			ajaxCooldown[url] = 0;
			clearTimeout(pendingTimer[url]);
			_g("loading").style.opacity = 0;

			var data = xhr.responseText;
			callback(JSON.parse(data),xhr);
			if (xhr.status != 200) {
                showBanner("Uh oh, an error occured when attempting to talk to the server", "statusmsg_ajaxerror");
			} else {
				hideBanner("statusmsg_ajaxerror");
			}	
		}
	}

	var isPosting = (typeof(data) != "undefined" && data);

	xhr.open((isPosting ? "POST" : "GET"), url);
	xhr.setRequestHeader("X-X", AUTHKEY);

	if (isPosting) {
		xhr.setRequestHeader("Content-type", "application/json"); //"x-www-form-urlencoded");
		xhr.setRequestHeader("X-DATA", JSON.stringify(data));
	}
	
	xhr.send(null);
	ajaxCooldown[url] = 1;
	pendingTimer[url] = setTimeout(function() {
		_g("loading").style.opacity = 1;
	}, 300);
}

function pollData() {
	var query;
	var callback;

	switch (currentPageType) {
		case "PHOTO":
		case "STREAM":
			query = "/stream/" + subscribedStream + "?since=" + lastUpdateTime;
			if (currentPageType == "PHOTO")
				query += "&photo";

			callback = function(data,xhr) {
				addTimelineArray(data.timeline,subscribedStream);
				for (var i = data.timeline.length - 1; i >= 0; i--) {
					addTimelineEvent(data.timeline[i], 0);
				}
				var t = Date.parse(xhr.getResponseHeader("date")) / 1000;
				lastUpdateTime = t;
			}
		break;
		case "BOARD":
			query = "/board/" + subscribedStream + "?since=" + lastBoardTime;
			callback = function(data) {
				addBoardItems(data,false);
			}
		break;
		case "POST":
			query = "/comments/" + subscribedStream + "?since=" + getLastCommentTime();
			callback = addComments;
		break;
		case "CHAT":
			query = "/chat/" + curChatUser + "?since=" + getLastChatTime();
			callback = addChatMessages;
			break;
	}

	query += "&n=" + lastNotificationTime;

	ajaxGet("beacon" + query,null, function(data,xhr) {
		if (data.notifications) {
		 	for (var i=0;i<data.notifications.length;i++) {
				addNotification(data.notifications[i]);
			}
		}
		if (typeof(data.data) != "undefined") { 
			callback(data.data,xhr);
		}
	});
}

function updateOnlineFriends() {
	ajaxGet("work/onlinefriends", null, function(data) {
		for (id in FRIENDS) { 
			var online = false;

			for (var i = 0; i < data.length; i++) {
				if (data[i].id == id) {
				  online = true;
				}
			}
			addFriend(id, online);
		}

		updateFriendsList();
	});
}

