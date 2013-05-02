var curChatUser;

//If true, the scroll handler will ignore upscrolling events
var chat_downloadingOlder;

var chatMessages = [];

var scrollUpHandler = function(e) {
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
	e.addEventListener("DOMMouseScroll", scrollUpHandler);
	e.addEventListener("mousewheel", scrollUpHandler);
}

function getNewChatMessages() {
	chat_downloadingOlder = true;

	ajaxGet("work/chat.php?with=" + curChatUser + "&time=" + chatMessages[0][2]);
}

function getLastChatTime() {
	return chatMessages[chatMessages.length - 1][2];
}

function addChatMessage(from, msg, time, reltime, prepend, unconfirmed) {
	var sc = _g("scrollUpContent");

	var ele = document.createElement("div");
	ele.className = "chatmsg";

	if (typeof(unconfirmed) != "undefined" && unconfirmed)
		ele.className += " unconfirmedchat";

	ele.id = "msg_" + time;
	ele.innerHTML = "<img class='avatar' src='" + getAvatar(from) + "'><div class='time' data-time='" + reltime + "'></div>" + msg;

	if (typeof(prepend) != "undefined" && prepend) {
		sc.insertBefore(ele, sc.children[0]);
		chatMessages.unshift([from,msg,time]);
	} else {
		sc.appendChild(ele);
		sc.scrollTop = Math.pow(10,9);
		chatMessages.push([from,msg,time]);
	}

}

function hideUnconfirmedMessages() {
	var dom = document.getElementsByTagName("div");
	for (i = 0; i < dom.length; i++) {
		if (dom[i].className.indexOf("unconfirmedchat") != -1) {
			_g("scrollUpContent").removeChild(dom[i]);
			dom[i] = null;
		}
	}
}

function handleKeyDown_Chat(e) {
	if (!e)
		e = window.event;

	if (e.keyCode == 13)
	{
		var msg = _g("composer").value;
		setTimeout('_g("composer").value="";',10);

		if (msg == "") return;

		sendChatMessage(curChatUser, msg);
		addChatMessage(curUser, msg, getLastChatTime(), 0, false, true);
	}
}

function sendChatMessage(to, msg) {
	var vars = [];
	vars["to"] = to;
	vars["msg"] = msg;

	ajaxGet("work/message.php", vars);
}

function setUserAttention(user, on) {
	setUserStatus(user);

	if (on)
		_g("friendicon_" + user).className += " attn";

}

function setUserStatus(user) {
	var e = _g("friendicon_" + user);
	if (FRIENDS[user]) { //online status
		e.className = "online";
	} else {
		e.className = "offline";
	}
}