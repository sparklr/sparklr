var FRIENDS = {};
var newMessageUsers = [];

var lastMessageFrom;

//If true, the scroll handler will ignore upscrolling events
var chat_downloadingOlder;

var chatMessages = [];

function scrollUpHandler(e) {
	if (!_g("scrollUpContent"))
		return;

	if (!e) e = window.event;

	var d;

	if (e.detail)
		d = e.detail * -1;
	else
		d = e.wheelDelta;

	var ele = _g("scrollUpContent");

	if (d > 0) {
		if (ele.scrollTop < 5) {
			if (!chat_downloadingOlder)
				getNewChatMessages();
		}
	}
}

function setupScrollHandler() {
	var e = _g("scrollUpContent");
	//e.addEventListener("DOMMouseScroll", scrollUpHandler);
	//e.addEventListener("mousewheel", scrollUpHandler);
}

// TODO
function getNewChatMessages() {
	chat_downloadingOlder = true;
	console.log("getting older");
	console.log(chatMessages[0][2]);
	ajaxGet("work/chat/" + curChatUser + "?starttime=" + chatMessages[0][2], null, function(data) {
		for (var i = 0; i < data.length; i++) {
			addChatMessage(data[i].from, data[i].message, data[i].time, true);
		}
		chat_downloadingOlder = false;
	});
}

function getLastChatTime() {
	if (chatMessages.length > 0) {
		return chatMessages[chatMessages.length - 1][2];
	} else {
		return 0;
	}
}

function addChatMessages(data) {
	data = data.data || data;
	for (var i = data.length - 1; i >= 0; i--) {
		addChatMessage(data[i].from, data[i].message, data[i].time, false);
	}
	if (data.length > 0)
		hideUnconfirmedMessages();
}

function addChatMessage(from, msg, time, prepend, unconfirmed) {
	var sc = _g("scrollUpContent_"+from);

	var ele = document.createElement("div");
	ele.className = "chatmsg";

	if (typeof(unconfirmed) != "undefined" && unconfirmed)
		ele.className += " unconfirmedchat";

	ele.id = "msg_" + time;
	var html = "";
	if (lastMessageFrom != from || prepend && lastMessageFrom == from) {
		html += "<img class='littleavatar' onClick='location.href=\"#/user/" + from + "\";' src='" + getAvatar(from) + "'><div class='time' data-time='" + time + "'></div>";
	}
	html += "<div style='display:block;margin-left: 25px'>" + processMedia(escapeHTML(msg)) + "</div>";

	ele.innerHTML = html;
	
	if (typeof(prepend) != "undefined" && prepend) {
		sc.insertBefore(ele, sc.children[0]);
		chatMessages.unshift([from,msg,time]);
	} else {
		sc.appendChild(ele);
		setTimeout(function() { sc.scrollTop = 0xFFFFFF; },5);
		chatMessages.push([from,msg,time]);
	}

	if (!unconfirmed)
		lastMessageFrom = from;
}

function hideUnconfirmedMessages() {
	var dom = document.getElementsByTagName("div");
	for (i = 0; i < dom.length; i++) {
		if (dom[i].className.indexOf("unconfirmedchat") != -1) {
			_g("scrollUpContent").removeChild(dom[i]);
		}
	}
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
		_g("attachment").style.display = "none";
	}

	setTimeout(function() {
		_g("composer_"+id).value="";
		expandTextarea(_g("composer_"+id));
	},10);

	if (!vars.message && !vars.postData) return;
	addChatMessage(curUser, vars.message, getLastChatTime(), false, true);

	ajaxGet("work/chat", vars, function(data,xhr) {
		if (data.error && data.info == "Blocked") {
			showBanner("Sorry, that user has blocked you.", "bannerblocked", 4000);
		}
		imgAttachments = null;
		pollData();
	});
}

function addFriendElement(id) {
	var e = document.createElement("a");
	e.id = "friendicon_" + id;
	e.onclick = function() { location.href='#/chat/' + id; };
	e.innerHTML = "<img src='" + getAvatar(id) + "'><div class='names'>" + getDisplayName(id) + "</div></a>";
	
	_g("friendslist").appendChild(e);
	return e;
}

function setUserAttention(user, on) {
	newMessageUsers[user] = on;
	setUserStatus(user);
}

function setUserStatus(user) {
	var e = _g("friendicon_" + user);
	if (!e) e = addFriendElement(user);
	
	e.className = (newMessageUsers[user] ? " attn" : "");
}

function setNewInbox(value) {
	var e = _g("inbox");
	e.className = "inbox" + (value ? " jiggle" : "");
}

function chatWith(id) {
	var pid = addWindow("m" + id, function() {
		// closed
	});
	renderTemplate("chat/" + id, pid)
	console.log(id);
	return;
	location.href = '/#/chat/' + id;

}
