var ajaxCooldown = [];

function ajaxGet(url, data) {
	if (ajaxCooldown[url]) 
		return; //already a pending request for that url

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			ajaxCooldown[url] = 0;
			if (xhr.status == 200) {
				processData(xhr.responseText);
                hideBanner("statusmsg_ajaxerror");
			} else {
				//awk
                console.log(xhr.status);
                showBanner("Uh oh, an error occured when attempting to talk to the server", "statusmsg_ajaxerror");
			}
		}
	}

	var isPosting = (typeof(data) != "undefined");

	xhr.open((isPosting ? "POST" : "GET"), url);
	xhr.setRequestHeader("X-X", AUTHKEY);

	if (isPosting) {
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send(getKeystrFromArray(data));
	} else {
		xhr.send(null);
	}

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
			for(i=0;i<arr.length;i++) {
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
		case "T": //Timeline
			renderTimeline();
			subscribedStream = parseInt(data.substring(2,3));
			console.log(subscribedStream);
			
			var arr = JSON.parse(data.substring(3));
			for(i=arr.length-1;i>=0;i--) {
				addTimelineEvent(arr[i]);
			}
			addTimelineArray(arr,subscribedStream);
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
            _g("content").innerHTML = ERROR_ACCESS_DENIED;
            break;
		case "M": //append chat
			hideUnconfirmedMessages();
			var arr = JSON.parse(data.substring(2));
			for (i = 0; i < arr.length; i++) {
				addChatMessage(arr[i].from,arr[i].message,arr[i].time,arr[i].reltime);
			}
			break;
		case "m": //prepend chat
			var arr = JSON.parse(data.substring(2));
			for (i = arr.length - 1; i >= 0; i--) {
				addChatMessage(arr[i].from,arr[i].message,arr[i].time,arr[i].reltime,true);
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
		case "$":
			var s = data.substring(2).split("<script>");
			_g("content").innerHTML = s[0];
			setTimeout(s[1],0);
			break;
		case "#":
			setTimeout(data.substring(2), 0);
			break;
	}
}

function pollData() {
	var query;

	switch (currentPageType) {
		case "STREAM":
		case "BOARD":
			query = "stream=" + subscribedStream + "&old=" + getLastPostTime();
			query += "&commentcount=" + getCommentSum() + "&streamcount=" + timelineEvents[subscribedStream].length;
			if (currentPageType == "BOARD")
				query += "&board=" + lastBoardTime + "&target=" + subscribedStream;
		break;
		case "POST":
			query = "post=" + subscribedStream + "&old=" + getLastCommentTime();
		break;
		case "CHAT":
			query = "chat=" + curChatUser + "&time=" + getLastChatTime();
		break;
	}

	query += "&n=" + lastNotificationTime;
	if (currentLocation != "") {
		query += "&l=" + currentLocation;
	}
	ajaxGet("work/beacon.php?" + query);
}
setInterval("pollData();", 1000);
