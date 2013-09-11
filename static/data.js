var ajaxCooldown = [];

function ajaxGet(url, data, callback) {
	if (ajaxCooldown[url]) {
		return; //already a pending request for that url
	}

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			ajaxCooldown[url] = 0;

			var data = xhr.responseText;
			try {
				callback(JSON.parse(data),xhr);
			} catch (e) {
			}
			if (xhr.status != 200) {
				if (xhr.status == 404) {
					eval(getTemplate("404"));
					_g("content").innerHTML = html;
				} else {
					showBanner("Uh oh, an error occured when attempting to talk to the server", "statusmsg_ajaxerror");
				}
			} else {
				hideBanner("statusmsg_ajaxerror");
			}	
		}
	}

	var isPosting = (typeof(data) != "undefined" && data);

	xhr.open((isPosting ? "POST" : "GET"), url);
	xhr.setRequestHeader("X-X", AUTHKEY);

	var postData;

	if (isPosting) {
		xhr.setRequestHeader("Content-type", "application/json");

		if (data.postData) {
			postData = data.postData;
			data.postData = 1;
		}

		xhr.setRequestHeader("X-DATA", JSON.stringify(data));
	}
	
	xhr.send(postData || null);
	ajaxCooldown[url] = 1;
}

function pollData() {
	var query;
	var callback;

	switch (currentPageType) {
		case "PHOTO":
		case "MENTIONS":
		case "TAG":
		case "STREAM":
			query = streamUrl(getLastStreamTime(subscribedStream));
			callback = function(data,xhr) {
				if (query != streamUrl(getLastStreamTime(subscribedStream)))
					return;

				var items = data.data || data;
				addTimelineArray(items,subscribedStream);
				for (var i = items.length - 1; i >= 0; i--) {
					addTimelineEvent(items[i], 0);
				}
				var t = Date.parse(xhr.getResponseHeader("date")) / 1000;
				lastUpdateTime = t;
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
		default:
			query = "/?";
			break;
	}

	ajaxGet("beacon" + query + "&n=" + lastNotificationTime,null, function(data,xhr) {
		if (data.notifications) {
		 	for (var i=0;i<data.notifications.length;i++) {
				addNotification(data.notifications[i]);
			}
		}
		callback(data,xhr);
	});
}

