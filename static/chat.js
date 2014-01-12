/* Sparklr
 * Handle chat system, new message events, etc
 */

// Keep track of last message sender, dont repeat names in chat
var lastMessageFrom = {};

// Keep track of message times for fetching older messages
var chatTimes = {};

function scrollUpHandler(e) {
	if (!e) e = window.event;

	var delta;

	if (e.detail)
		delta = e.detail * -1;
	else
		delta = e.wheelDelta;

	var ele = e.currentTarget;

	if (delta > 0) { // scrolling up
		if (ele.scrollTop < 5) {
			getOldChatMessages(ele.getAttribute('data-with'));
		}
	}

	if (e.wheelDelta < 0 && ele.scrollTop >= ele.scrollHeight - ele.clientHeight) 
		e.preventDefault(); 
	if (e.wheelDelta > 0 && ele.scrollTop == 0)
		e.preventDefault();
}

function getOldChatMessages(user) {
	ajax("work/chat/" + user + "?starttime=" + chatTimes[user + "," + CURUSER][0], null, function(data) {
		for (var i = 0; i < data.length; i++) {
			addChatMessage(data[i].from, data[i].to, data[i].message, data[i].time, true);
		}
	});
}

function getLastChatTime() {
	if (chatTimes.length > 0) {
		return chatTimes[convoid][chatTimes.length - 1];
	} else {
		return 0;
	}
}

function addChatMessage(from, to, msg, time, prepend) {
	var convoid;
	if (from == CURUSER)
		convoid = to + "," + from;
	else 
		convoid = from + "," + to;

	var sc = _g("scrollUpContent_"+convoid);
	if (!sc)
		return;

	var ele = document.createElement("div");
	ele.className = "chatmsg";

	ele.id = "msg_" + time;
	var html = "";
	if (lastMessageFrom[convoid] != from || prepend && lastMessageFrom[convoid] == from) {
		html += "<img class='littleavatar' onClick='location.href=\"#/user/" + from + "\";' src='" + getAvatar(from) + "'><div class='time' data-time='" + time + "'></div>";
	}
	html += "<div style='display:block;margin-left: 25px'>" + processMedia(escapeHTML(msg)) + "</div>";

	ele.innerHTML = html;

	if (typeof(prepend) != "undefined" && prepend) {
		sc.insertBefore(ele, sc.children[0]);
		chatTimes[convoid].unshift(time);
	} else {
		sc.appendChild(ele);
		setTimeout(function() { _g('scrollUpContent_'+convoid).scrollTop = 0xFFFFFF; },5);
		chatTimes[convoid].push(time);
	}

	lastMessageFrom[convoid] = from;
}

function sendChatMessage(e) {
	var id = e.target.getAttribute("data-id");
	var vars = {
		to: id.replace("chat_",""),
		message: _g("composer_"+id).value
	};
	
	if (imgAttachments) {
		vars.postData = imgAttachments.target.result;
		vars.img = 1;
		_g("attachment"+id).style.display = "none";
	}

	setTimeout(function() {
		_g("composer_"+id).value="";
		expandTextarea(e);
	},10);

	if (!vars.message && !vars.postData) return;

	addChatMessage(CURUSER, vars.to, vars.message, getLastChatTime(), false, true);

	ajax("work/chat", vars, function(data,xhr) {
		if (data.error && data.info == "Blocked") {
			showBanner("Sorry, that user has blocked you.", "bannerblocked", 4000);
		}
		imgAttachments = null;
		pollData();
	});
}

function setNewInbox(value) {
	var e = _g("inbox");
	e.className = "inbox" + (value ? " jiggle" : "");
}

function chatWith(id) {
	if (MOBILE) {
		location.href = "#/chat/" + id;
	} else {
		var pid = addWindow("m" + id + "," + CURUSER, function() {
			// closed
			// we're always subscribed to notifications sent to the user
		});
		renderTemplate("chat/" + id, pid)
	}
}

