var ajaxCooldown = [];

function ajaxGet(url, data, callback) {
	if (ajaxCooldown[url]) {
		return; //already a pending request for that url
	}

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			ajaxCooldown[url] = 0;
			if (xhr.status == 200) {
				var data = xhr.responseText;
				if (data.substring(0,1) == "~")
					processData(data);
				else
					callback(JSON.parse(data));
                hideBanner("statusmsg_ajaxerror");
			} else {
				//awk
                showBanner("Uh oh, an error occured when attempting to talk to the server", "statusmsg_ajaxerror");
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
}

function getKeystrFromArray(data) {
	var keystr = "";

	for (key in data) {
		keystr += key + "=" + encodeURIComponent(data[key]) + "&";
	}
	
	return keystr;
}

function processData(data) {
	if (data.substring(0,1) != "~")
		return; //bad transmission

	var header = data.substring(1,2);

	switch (header) {
		case "B": //Bye (logoff)
			location.href='.';
			break;
		case "A"://Add to timeline
			var arr = JSON.parse(data.substring(2));
			for(var i = arr.length - 1; i >= 0; i--) {
				addTimelineEvent(arr[i]);
			}
			addTimelineArray(arr,subscribedStream);
			break;
		case "a": //same, but little
			var arr = JSON.parse(data.substring(2));
			for(i=0;i<arr.length;i++) {
				addTimelineEvent(arr[i],true);
			}
			addTimelineArray(arr,subscribedStream,true);
			break;
		case "c": //update comment counts
			var arr = JSON.parse(data.substring(2));
			for (id in arr) {
				updateCommentCount(id, arr[id]);
			}
			break;
		case "C": //new comment(s)
			addComments(JSON.parse(data.substring(2)));
			break;
		case "b": //new board item(s)
			addBoardItems(JSON.parse(data.substring(2)));
			break;
		case "o": //old board items
			addBoardItems(JSON.parse(data.substring(2)), true);
			break;
		case "p": //post
			showPost(JSON.parse(data.substring(2)));
			break;
        case "D": // access denied
			if (data.substring(2) != "")
				showPrivateUser(JSON.parse(data.substring(2)));
			else
	            _g("content").innerHTML = "<div class='contentwrapper'>" + ERROR_ACCESS_DENIED + "</div>";
            break;
		case "M": //append chat
			hideUnconfirmedMessages();
			var arr = JSON.parse(data.substring(2));
			for (i = 0; i < arr.length; i++) {
				addChatMessage(arr[i].from,arr[i].message,arr[i].time);
			}
			break;
		case "m": //prepend chat
			var arr = JSON.parse(data.substring(2));
			for (i = arr.length - 1; i >= 0; i--) {
				addChatMessage(arr[i].from,arr[i].message,arr[i].time,true);
				chat_downloadingOlder = false;
			}

			break;
		case "N": //notification
			var arr = JSON.parse(data.substring(2));
			for (i=0;i<arr.length;i++) {
				addNotification(arr[i]);
			}
			break;
		case "P": //Poll
			var commands = data.substring(2).split("<cmd>");
			for(var i = 0; i < commands.length; i++) {
				processData(commands[i]);
			}
			break;
		case "F": //Online friends
			FRIENDS = [];
			var friends = data.substring(2).split(",");
			for (var i = 0; i < friends.length; i++) {
				if (friends[i] != "") {
					var s = friends[i].split(":");
					addFriend(s[0],parseInt(s[1]));
				}
			}
			updateFriendsList();
			break;
		case "u": //user page
			showUserPage(JSON.parse(data.substring(2)));
			break;
		case "i": //photos page
			showPhotosPage(JSON.parse(data.substring(2)));
			break;
		case "R": //reload
			location.href = window.location + "#";
			break;
		case "s": //search
			searchResultsCallback(JSON.parse(data.substring(2)));
			break;
		case "U":
			pullHandlesFromServerCallback(JSON.parse(data.substring(2)));
			break;
		case "$":
			var s = data.substring(2).split("<script>");
			_g("content").innerHTML = s[0];
			if (_g("sidebar_links")) {
				_g("sidebar").innerHTML = _g("sidebar_links").innerHTML;
			} else {
				_g("sidebar").innerHTML = "";
			}
			setTimeout(s[1],0);
			break;
		case "#":
			setTimeout(data.substring(2), 0);
			break;
		case "4":
			_g("content").innerHTML = "<div class='contentwrapper'>" + ERROR_NOT_AVAILABLE + "</div>";
			_g("sidebar").innerHTML = "";
			break;
	}
}

function pollData() {
	var query;
	var callback;

	switch (currentPageType) {
		case "PHOTO":
		case "STREAM":
			query = "/stream/" + subscribedStream + "?since=" + lastUpdateTime;
			//query += "&commentcount=" + getCommentSum() + "&streamcount=" + timelineEvents[subscribedStream].length;
			if (currentPageType == "PHOTO")
			query += "&photo";

			callback = function(data) {
				addTimelineArray(data.timeline,subscribedStream);
				for (var i = 0; i < data.timeline.length; i++) {
					addTimelineEvent(data.timeline[i], 0);
				}
				updateCommentCounts(data.commentcounts);
				lastUpdateTime = Math.floor((new Date).getTime() / 1000);
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

	//ajaxGet("http://localhost:8080/work/beacon.php?user=" + curUser + "&authkey=" + AUTHKEY + "&" + query);
//ajaxGet("work/beacon.php?" + query);
	ajaxGet("beacon" + query,null, function(data) {
		if (data.notifications) {
		 	for (var i=0;i<data.notifications.length;i++) {
				addNotification(data.notifications[i]);
			}
		}
		callback(data.data);
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

