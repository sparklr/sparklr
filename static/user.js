/* Sparklr
 * Handles user objects, names, avatars, handles
 */

var DISPLAYNAMES = [];
var USERHANDLES = [];
var AVATAR_IDS = [];
var HIDDEN_USERS = [];
var handlesToFetch = [];

var fetchTaskAsync;

var CHARMOD = '\u273B';
var CHARADMIN = '\u273C';

function getAvatar(id,plain,large) {
	return imgUrl(id + ".jpg" + (plain || !AVATAR_IDS[id] ? "" : "?" + AVATAR_IDS[id]),large);
}

function getDisplayName(id) {
	if (DISPLAYNAMES[id])
		return processDisplayName(DISPLAYNAMES[id]);
	fetchUserHandle(id);
	return "<cite data-id='" + id + "'></cite>";
}

function processDisplayName(name){
	name = name.replace(CHARMOD,"<span class='mod' title='Community Moderator'></span>");
	name = name.replace(CHARADMIN,"<span class='admin' title='Admin'></span>");
	return name;
}

function getUserHandle(id) {
	if (USERHANDLES[id])
		return USERHANDLES[id];
	fetchUserHandle(id);
	return "<cite data-id='" + id + "' data-handle='1'></cite>";
}

function fetchUserHandle(id) {
	for (var i = 0; i < handlesToFetch.length; i++) {
		if (handlesToFetch[i] == id)
			return;
	}
	handlesToFetch.push(id);
	clearTimeout(fetchTaskAsync);
	fetchTaskAsync = setTimeout(pullHandlesFromServer, 1); //defer this 
}

function pullHandlesFromServer() {
	ajax("username/" + handlesToFetch.join(","), null, pullHandlesFromServerCallback);
	handlesToFetch = [];
}

function pullHandlesFromServerCallback(handles) {
	var tags = document.getElementsByTagName("cite");
	for (var h in handles) {
		USERHANDLES[handles[h].id] = handles[h].username;
		DISPLAYNAMES[handles[h].id] = handles[h].displayname;
		AVATAR_IDS[handles[h].id] = handles[h].avatarid;
		updateAvatar(handles[h].id, handles[h].avatarid);
	}
	for (var i = 0; i < tags.length; i++) {
		for (var h in handles) {
			var id = handles[h].id;
			if (tags[i].getAttribute("data-id") == id) {
				if (tags[i].getAttribute("data-handle")) {
					tags[i].innerHTML = handles[h].username;
				} else {
					tags[i].innerHTML = processDisplayName(handles[h].displayname);
				}
			}
		}
	}
}

function follow(id,redir) {
	ajax("follow/"+id, null, function() { if (!redir) location.href += "/#"; });	
}

function unfollow(id) {
	ajax("unfollow/"+id, null, function() { location.href += "/#"; });
}

function updateAvatar(user, avatarid) {
	var elements = document.getElementsByTagName("img");
	for (var i = 0; i < elements.length; i++) {
		var small = getAvatar(user, true);
		var big = imgUrl(user + ".jpg", true);

		if (elements[i].src.indexOf(small) != -1)
			elements[i].src = small + "?" + avatarid;
		if (elements[i].src.indexOf(big) != -1)
			elements[i].src = big + "?" + avatarid;
	}
	AVATAR_IDS[user] = avatarid;
}

function signOff() {
	showConfirm("Sign off", "Are you sure you want to sign off?", function() {
		ajax("signoff", null, function() { location.href='/'; });
	});
}

function inviteFriend() {
	location.href="/#/invite";
}

function inviteUser(to,cb) {
	ajax("sendinvite/" + to, null, function(result) {
		if (result === true) {
			_g("inviteField").style.boxShadow = "none";
			_g("inviteField").value = "";
			cb.value = "Sent!";
			setTimeout(function() { cb.value = "Send Invitation"; }, 2000);
		} else
			_g("inviteField").style.boxShadow = "0px 0px 15px #ff0000";
	});
}

function getUserSuggestions(input) {
	var items = [];
	for (id in DISPLAYNAMES) {
		if (new RegExp(input, "i").test(DISPLAYNAMES[id])) {
			items[id] = DISPLAYNAMES[id];
		}
	}
	return items;
}

function meetSomeoneRandom() {
	ajax("random", null, function(data) {
		location.href='#/user/' + data;
	});
}

function signin() {
	ajax("signin/" + _g('username').value + '/' + _g('password').value, null, function(data) {
		if (data) {
			location.href = '.';
		} else {
			_g('forgot_password').className = 'show';
		}
	});
}

function forgotPassword() {
	if (_g("username").value != "") {
		ajax("forgot/" + _g("username").value, null, function(result) {
			if (result) {
				_g('login_callback').innerHTML = "Your password has successfully been reset.<br>Please check your email for further instructions.";
			} else {
				_g('login_callback').innerHTML = "That email or username does not appear to be registered to anyone.";
			}
		});
	}
}

function showSignin() {
	showPopup(getTemplate('signin')());
}

