var ajaxCooldown = [];
var subscribedStreams = [];
var ws;

function ajaxGet(url, data, callback) {
	if (ajaxCooldown[url]) {
		return; //already a pending request for that url
	}

	var xhr = new XMLHttpRequest();
	xhr.upload.onprogress = uploadingProgress;

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			hideProgress();
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

function uploadingProgress(evt) {
	if (evt.lengthComputable) {
		var e = _g("loading").style;
		e.opacity = 1;
		e.width = ((evt.loaded / evt.total) * 100) + "%";
	}
}
function hideProgress() {
	var e = _g("loading").style;
	e.width = 0;
	e.opacity = 0;
}

function pollData() {
	if (ws != null && ws.p18Connected)
		return;

	var query;
	var callback;

	switch (currentPageType) {
		case "PHOTO":
		case "MENTIONS":
		case "TAG":
		case "STREAM":
			query = streamUrl(getLastStreamTime(subscribedStream));
			callback = function(data,xhr) {
				if (query != streamUrl(getLastStreamTime(subscribedStream))) {
					console.log("query does not match");
					return;
				}

				var items = data.data || data;

				if (missingPosts.length > 0) {
					items = items.concat(missingPosts);
					missingPosts = [];
				}

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
			query = "/chat/" + location.hash.split("/")[2] + "?since=" + getLastChatTime();
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

function subscribeToStream(stream) {
	if (subscribedStreams.indexOf(stream) == -1)
		subscribedStreams.push(stream);
	try {
		ws.send("S" + stream);
	} catch(e) {
	}
}

function unsubscribeFromStream(stream) {
	if (joinedNetworks.indexOf(stream) !== -1) return;

	if ((i = subscribedStreams.indexOf(stream)) !== -1)
		subscribedStreams.splice(i,1);
	try {
		ws.send("U" + stream);
	} catch(e) {
	}
}

function connectSocket() {
	ws = new WebSocket("ws://127.0.0.1:8081")
	ws.onopen = function(e) {
		ws.send(curUser + "," + AUTHKEY);	
	};
	ws.onmessage = socketMessage;
	ws.onclose = ws.onerror = function() {
		setTimeout(connectSocket, 1000);
	}
	ws.p18Connected = false;
}

function socketMessage(e) {
	if (!ws.p18Connected) {
		if (e.data == "c:")
			ws.p18Connected = true;
		broadcastSubscriptions();
		return;
	}
	var data = JSON.parse(e.data);
	console.log(data);
	switch (data.t) {
		case 0: // add comment
			renderComment(data,true);
		break;
		case 1: // chat
			addChatMessage(data.from, data.to, data.message, data.time, false);
		break;
		case 2:
			if (subscribedStream == data.network || subscribedStream == e.from)
				addTimelineEvent(data,0);
			/*else if (joinedNetworks.indexOf(data.network) !== -1)
				highlightNetwork(data.network);
				*/
		break;
		case 3: // notification
			addNotification(data);
		break;
	}
}

function broadcastSubscriptions() {
	ws.send("s" + subscribedStreams.join(","));
	console.log("broad");
}

setTimeout(connectSocket,100);
