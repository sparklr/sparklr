/* Sparklr
 * data.js: Code related to AJAX and socket connections
 */

// list of requests by URL
var ajaxCooldown = {};

// The current stream (timeline, comment, etc) we are polling
var subscribedStream;
var subSubscribedStream;
var subPageType;


function ajax(url, data, callback) {
	if (ajaxCooldown[url]) {
		return; //already a pending request for that url
	}

	var isPosting = (typeof(data) != "undefined" && data);

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (isPosting)
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
					showBanner("Uh oh, an error occurred when attempting to talk to the server", "statusmsg_ajaxerror");
				}
			} else {
				hideBanner("statusmsg_ajaxerror");
			}	
		}
	}

	xhr.open((isPosting ? "POST" : "GET"), 'api/' + url);
	xhr.setRequestHeader("X-X", AUTHKEY);

	var postData;

	if (isPosting) {
		xhr.upload.onprogress = uploadingProgress;
		xhr.setRequestHeader("Content-type", "application/json");

		if (data.postData) {
			postData = data.postData;
			data.postData = 1;
		}

		xhr.setRequestHeader("X-DATA", encodeURIComponent(JSON.stringify(data)));
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

function streamUrl(since,start) {
	var query = "";
	var part = "stream/";

	if (currentPageType == "TAG")
		part = "tag/";
	if (currentPageType == "MENTIONS")
		part = "mentions/";

	query += part + subscribedStream + "?since=" + since;

	if (start)
		query += "&starttime=" + start;

	if (currentPageType == "PHOTO")
		query += "&photo=1";

	return query;
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
				if (query != streamUrl(getLastStreamTime(subscribedStream))) {
					// TODO
				}
				var items = data.data || data;

				for (var i = items.length - 1; i >= 0; i--) {
					addTimelineEvent(items[i], 0);
				}
				addTimelineArray(items,subscribedStream);
			}
		break;
		case "POST":
			query = "comments/" + subscribedStream + "?since=" + getLastCommentTime();
			callback = addComments;
		break;
		default:
			query = "?";
			break;
	}

	ajax("beacon/" + query + "&n=" + lastNotificationTime, null, function(data,xhr) {
		if (data.notifications) {
		 	for (var i=0;i<data.notifications.length;i++) {
				addNotification(data.notifications[i]);
			}
		}
		callback(data,xhr);
	});

	if (subPageType == "POST") {
		ajax("comments/" + subSubscribedStream + "?since=" + getLastCommentTime(), null, addComments);
	}
}

function uploadImage(e, url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr);
			hideProgress();
		}
	}
	xhr.upload.onprogress = uploadingProgress;
	xhr.open("POST", 'api/' + url);
	xhr.setRequestHeader("X-X", AUTHKEY);
	xhr.setRequestHeader("X-DATA", JSON.stringify({ img: 1 }));
	xhr.send(e.target.result);
}

