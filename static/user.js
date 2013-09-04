var DISPLAYNAMES = [];
var USERHANDLES = [];
var AVATAR_IDS = [];
var HIDDEN_USERS = [];
var IS_PRIVATE = false;
var handlesToFetch = [];
var fetchTaskAsync;

function getAvatar(id,plain) {
	return imgUrl(id + ".jpg" + (plain || !AVATAR_IDS[id] ? "" : "?" + AVATAR_IDS[id]));
}

function getDisplayName(id) {
	if (DISPLAYNAMES[id])
		return DISPLAYNAMES[id];
	return "@"+getUserHandle(id);
}

function getUserHandle(id) {
	if (USERHANDLES[id])
		return USERHANDLES[id];
	fetchUserHandle(id);
	return "<var data-id='" + id + "'></var>";
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
	ajaxGet("work/username/" + handlesToFetch.join(","), null, pullHandlesFromServerCallback);
	handlesToFetch = [];
}

function pullHandlesFromServerCallback(handles) {
	var tags = document.getElementsByTagName("var");
	for (var i = 0; i < tags.length; i++) {
		for (var h in handles) {
			var id = handles[h].id;
			if (tags[i].getAttribute("data-id") == id) {
				tags[i].innerHTML = handles[h].username;
			}
			USERHANDLES[handles[h].id] = handles[h].username;
		}
	}
}

function chatWith(id) {
	location.href = "#/chat/" + id;
}

function follow(id,redir) {
	ajaxGet("work/follow/"+id, null, function() { if (!redir) location.href += "/#"; });	
	lastUpdateTime = 0;
}

function unfollow(id) {
	ajaxGet("work/unfollow/"+id, null, function() { location.href += "/#"; });
}

function mention(handle) {
	location.href='#/mention/'+handle;
}

//Current user actions

function updateAvatar(user, avatarid) {
	var elements = document.getElementsByTagName("img");
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].src.indexOf(getAvatar(user,true)) != -1) {
			elements[i].src = getAvatar(user,true) + "?" + avatarid;
		}
	}
	AVATAR_IDS[user] = avatarid;
}

function signOff() {
	ajaxGet("work/signoff", null, function() { location.href='/'; });
}

function inviteFriend() {
	location.href="/#/invite";
}

function inviteUser(to,cb) {
	ajaxGet("work/sendinvite/" + to, null, function(result) {
		if (result === true) {
			_g("inviteField").style.boxShadow = "none";
			_g("inviteField").value = "";
			cb.value = "Sent!";
			setTimeout(function() { cb.value = "Send Invitation"; }, 2000);
		} else
			_g("inviteField").style.boxShadow = "0px 0px 15px #ff0000";
	});
}

function checkPasswords(password1,password2) {
	var result = _g("settings_result");
	var button = _g("savesettings");

	if (password1 != password2) {
		result.innerHTML = "The passwords do not match";
		result.className = "error";		
		button.disabled = true;
	} else {
		result.innerHTML = "";
		button.disabled = false;
	}
}

function checkUsername(username) {
	var alphanumeric = /^[A-Za-z0-9]+$/g;

	if (!alphanumeric.test(username))
		return checkUsernameCallback(2);
	if (username == USERHANDLES[curUser])
		return checkUsernameCallback(1);

	ajaxGet("work/checkusername/" + username,null,checkUsernameCallback);
}

function checkUsernameCallback(result) {
	var message = "";
	switch(result) {
		case true:
			message = "Awh, somebody already took that :c";
		break;
		case 2:
			message = "Usernames must be letters and numbers only";
		break;
	}
	_g("username_callback").innerHTML = message;
}

function updateAccountSettings() {
	var s = location.hash.split("/");
	var form = _g("form_settings");

	var obj;
	var type;

	switch (s[2]) {
		case "password":
			obj = { password: form.currentpassword.value, newpassword: form.password1.value }		
			type = "password";
			break;
		case "privacy":
			obj = { private: form.private[0].checked }
			type = "privacy";
			break;
		case "account":
			obj = { password: form.delete.value }
			type = "delete";
			break;
		default:
			obj = { username: form.username.value, email: form.email.value, displayname: form.displayname.value }
			type = "settings";
			break;
	}
	ajaxGet("work/" + type, obj, function(result) {
			if (result.authkey) {
				AUTHKEY = result.authkey;
				document.cookie = "D=" + curUser + "," + AUTHKEY;
			}
			if (result.deleted) {
				location.href="./";
			}
			updateSettingsCallback(result.result, result.message);
		});

	_g("savesettings").value = "Saving...";
}
function updateSettingsCallback(result, message) {
	console.log(result);
	_g("settings_result").innerHTML = message;
	_g("settings_result").className = result == true ? "ok" : "error";

	if (result) {
		_g("savesettings").value = "Saved";
		setTimeout(function() {
			_g("savesettings").value = "Save Settings";
		}, 4000);
	}
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

function requestWhitelist(user) {
	ajaxGet("work/requestwhitelist/" + user, null, function() {
		_g("btnWhitelist").disabled = true;
		_g("btnWhitelist").value = "Request Sent";
	});
}

function meetSomeoneRandom() {
	ajaxGet("work/random", null, function(data) {
		location.href='#/user/' + data;
	});
}
