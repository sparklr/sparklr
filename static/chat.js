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

	preventDefaultScroll(e);
}

function getOldChatMessages(user) {
	ajax("chat/" + user + "?starttime=" + chatTimes[user + "," + CURUSER][0], null, function(data) {
		for (var i = 0; i < data.length; i++) {
			addChatMessage(data[i], true);
		}
	});
}

function addChatMessage(msg, prepend, unconfirmed) {
	var convoid;
	if (msg.from == CURUSER)
		convoid = msg.to + "," + msg.from;
	else 
		convoid = msg.from + "," + msg.to;

	var sc = _g("scrollUpContent_"+convoid);
	if (!sc)
		return;

	var ele = document.createElement("div");
	ele.className = "chatmsg";

	ele.id = "msg_" + msg.time;

	msg.prepend = prepend;
	msg.unconfirmed = unconfirmed;

	eval(getTemplate("chatmsg"));

	ele.innerHTML = getTemplate("chatmsg")(msg);

	if (typeof(prepend) != "undefined" && prepend) {
		sc.insertBefore(ele, sc.children[0]);
		chatTimes[convoid].unshift(msg.time);
	} else {
		sc.appendChild(ele);
		if (sc.scrollHeight - (sc.scrollTop + 350) < 50) 
			setTimeout(function() { _g('scrollUpContent_'+convoid).scrollTop = 0xFFFFFF; },5);

		updateUI();

		chatTimes[convoid].push(msg.time);
	}

	lastMessageFrom[convoid] = msg.from;
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

	addChatMessage({ from: CURUSER, to: vars.to, message: (vars.img ? makeInlineImage(vars.postData,vars.postData) : "") + vars.message, time: (new Date).getTime() }, false, true);

	ajax("chat", vars, function(data,xhr) {
		if (data.error && data.info == "Blocked") {
			showBanner("Sorry, that user has blocked you.", "bannerblocked", 4000);
		}
		imgAttachments = null;
	});
}

function setNewInbox(value) {
	var e = _g("inbox");
	e.className = "icon-envelope" + (value ? " active jiggle" : "");
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

