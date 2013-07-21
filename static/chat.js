var curChatUser;
var FRIENDS = [];
var newMessageUsers = [];

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
	ajaxGet("work/chat/" + curChatUser + "?starttime=" + chatMessages[0][2], null, function(data) {
		for (var i = 0; i < data.length; i++) {
			addChatMessage(data[i].from, data[i].message, data[i].time, true);
			console.log(data[i].time);
			console.log(chatMessages[0][2]);
		}
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
	for (var i = data.length - 1; i >= 0; i--) {
		addChatMessage(data[i].from, data[i].message, data[i].time, false);
	}
	hideUnconfirmedMessages();
}

function addChatMessage(from, msg, time, prepend, unconfirmed) {
	var sc = _g("scrollUpContent");

	var ele = document.createElement("div");
	ele.className = "chatmsg";

	if (typeof(unconfirmed) != "undefined" && unconfirmed)
		ele.className += " unconfirmedchat";

	ele.id = "msg_" + time;
	ele.innerHTML = "<img class='avatar' onClick='location.href=\"#/user/" + from + "\";' src='" + getAvatar(from) + "'><div class='time' data-time='" + time + "'></div>" + msg;

	if (typeof(prepend) != "undefined" && prepend) {
		sc.insertBefore(ele, sc.children[0]);
		chatMessages.unshift([from,msg,time]);
	} else {
		sc.appendChild(ele);
		sc.scrollTop = 0xFFFFFF;
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

function sendChatMessage() {
	var vars = {
		to: curChatUser,
		message: _g("composer").value
	};
	
	setTimeout('_g("composer").value="";', 0);

	addChatMessage(curUser, vars.message, getLastChatTime(), false, true);

	ajaxGet("work/chat", vars);
}


function addFriend(id, status) {
	FRIENDS[id] = status;
}

function addFriendElement(id) {
	var e = document.createElement("a");
	e.id = "friendicon_" + id;
	e.onclick = function() { chatWith(id); };
	e.innerHTML = "<img src='" + getAvatar(id) + "'><div class='names'>" + getDisplayName(id) + "</div></a>";
	
	_g("friendslist").appendChild(e);
	return e;
}

function updateFriendsList() {
	for (id in FRIENDS) {
		setUserStatus(id);
	}
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
			setUserStatus(user);
		}
	});
}
function setUserAttention(user, on) {
	newMessageUsers[user] = on;
	setUserStatus(user);
}

function setUserStatus(user) {
	var e = _g("friendicon_" + user);
	if (!e) e = addFriendElement(user);
	
	e.className = FRIENDS[user] ? "online" : "offline" + (newMessageUsers[user] ? " attn" : "");
}

